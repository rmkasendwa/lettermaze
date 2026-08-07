import { Injectable, UnauthorizedException } from "@nestjs/common";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response } from "express";
import { PrismaService } from "../database/prisma.service";

const scrypt = promisify(scryptCallback);
const COOKIE = "lettermaze_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export interface StatisticsInput {
  gamesPlayed: number;
  totalWordsFound: number;
  highestScore: number;
  longestWord: string;
  totalScore: number;
}

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private tokenHash(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${hash.toString("hex")}`;
  }

  async verifyPassword(password: string, stored: string) {
    const [salt, hex] = stored.split(":");
    if (!salt || !hex) return false;
    const expected = Buffer.from(hex, "hex");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  async createSession(userId: string, response: Response) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_MS);
    await this.prisma.session.create({
      data: { tokenHash: this.tokenHash(token), userId, expiresAt },
    });
    response.cookie(COOKIE, token, {
      expires: expiresAt,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  async currentUser(request: Request) {
    const token = this.readCookie(request.headers.cookie, COOKIE);
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.tokenHash(token) },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!session || session.expiresAt <= new Date()) return null;
    return session.user;
  }

  async requireUser(request: Request) {
    const user = await this.currentUser(request);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async logout(request: Request, response: Response) {
    const token = this.readCookie(request.headers.cookie, COOKIE);
    if (token)
      await this.prisma.session.deleteMany({
        where: { tokenHash: this.tokenHash(token) },
      });
    response.clearCookie(COOKIE, { path: "/" });
  }

  async mergeStatistics(
    userId: string,
    importId: string,
    local: StatisticsInput,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const imported = await transaction.statisticImport.findUnique({
        where: { id: importId },
      });
      if (!imported) {
        await transaction.statisticImport.create({
          data: { id: importId, userId },
        });
        const current = await transaction.playerStatistics.findUnique({
          where: { userId },
        });
        await transaction.playerStatistics.upsert({
          where: { userId },
          create: { userId, ...local },
          update: {
            gamesPlayed: { increment: local.gamesPlayed },
            totalWordsFound: { increment: local.totalWordsFound },
            totalScore: { increment: local.totalScore },
            highestScore: Math.max(
              current?.highestScore ?? 0,
              local.highestScore,
            ),
            longestWord:
              local.longestWord.length > (current?.longestWord.length ?? 0)
                ? local.longestWord
                : current?.longestWord,
          },
        });
      } else if (imported.userId !== userId) {
        throw new UnauthorizedException();
      }
      return this.getStatistics(userId, transaction);
    });
  }

  async getStatistics(
    userId: string,
    client: Pick<PrismaService, "playerStatistics"> = this.prisma,
  ) {
    const stats = await client.playerStatistics.findUnique({
      where: { userId },
    });
    const base = stats ?? {
      gamesPlayed: 0,
      totalWordsFound: 0,
      highestScore: 0,
      longestWord: "",
      totalScore: 0,
    };
    return {
      ...base,
      averageScore: base.gamesPlayed ? base.totalScore / base.gamesPlayed : 0,
    };
  }

  private readCookie(header: string | undefined, name: string) {
    return header
      ?.split(";")
      .map((part) => part.trim().split("="))
      .find(([key]) => key === name)?.[1];
  }
}
