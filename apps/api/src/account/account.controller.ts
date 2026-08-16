import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { z } from "zod";
import { PrismaService } from "../database/prisma.service";
import { AccountService } from "./account.service";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});
const syncSchema = z.object({
  importId: z.uuid(),
  statistics: z.object({
    gamesPlayed: z.number().int().nonnegative(),
    totalWordsFound: z.number().int().nonnegative(),
    highestScore: z.number().int().nonnegative(),
    mostWordsFound: z.number().int().nonnegative(),
    longestWord: z.string().max(100),
    bestDailyScore: z.number().int().nonnegative(),
    totalScore: z.number().int().nonnegative(),
  }),
});
const completedGameSchema = z.object({
  score: z.number().int().nonnegative(),
  words: z.array(z.string().trim().min(1).max(100)).max(500),
  boardSize: z.number().int().min(2).max(10),
  durationSeconds: z.number().int().nonnegative().max(3600),
  puzzleId: z.string().trim().min(1).max(40).optional(),
});

@Controller("account")
export class AccountController {
  constructor(
    private readonly accounts: AccountService,
    private readonly prisma: PrismaService,
  ) {}

  @Post("register")
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException(
        "Enter a valid email and a password of at least 8 characters.",
      );
    try {
      const user = await this.prisma.user.create({
        data: {
          email: parsed.data.email.toLowerCase(),
          name: parsed.data.name,
          passwordHash: await this.accounts.hashPassword(parsed.data.password),
        },
      });
      await this.accounts.createSession(user.id, response);
      return { user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
      if ((error as { code?: string }).code === "P2002")
        throw new ConflictException(
          "An account with that email already exists.",
        );
      throw error;
    }
  }

  @Post("login")
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const parsed = credentialsSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid credentials.");
    const user = await this.prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (
      !user?.passwordHash ||
      !(await this.accounts.verifyPassword(
        parsed.data.password,
        user.passwordHash,
      ))
    )
      throw new BadRequestException("Invalid credentials.");
    await this.accounts.createSession(user.id, response);
    return { user: { id: user.id, email: user.email, name: user.name } };
  }

  @Get("session")
  async session(@Req() request: Request) {
    return { user: await this.accounts.currentUser(request) };
  }

  @Post("logout")
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.accounts.logout(request, response);
    return { success: true };
  }

  @Post("statistics/sync")
  async sync(@Req() request: Request, @Body() body: unknown) {
    const user = await this.accounts.requireUser(request);
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid statistics.");
    return this.accounts.mergeStatistics(
      user.id,
      parsed.data.importId,
      parsed.data.statistics,
    );
  }

  @Post("games")
  async recordGame(@Req() request: Request, @Body() body: unknown) {
    const user = await this.accounts.requireUser(request);
    const parsed = completedGameSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException("Invalid game result.");
    await this.accounts.recordCompletedGame(user.id, parsed.data);
    return { accepted: true };
  }

  @Get("profile")
  async profile(@Req() request: Request) {
    const user = await this.accounts.requireUser(request);
    return this.accounts.getProfile(user.id);
  }

  @Get("games")
  async games(
    @Req() request: Request,
    @Query("cursor") cursor?: string,
    @Query("limit") rawLimit?: string,
  ) {
    const user = await this.accounts.requireUser(request);
    const parsed = z.coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .safeParse(rawLimit ?? 10);
    if (!parsed.success) throw new BadRequestException("Invalid page size.");
    return this.accounts.getGames(user.id, parsed.data, cursor);
  }

  @Get("games/:id")
  async game(@Req() request: Request, @Param("id") id: string) {
    const user = await this.accounts.requireUser(request);
    return this.accounts.getGame(user.id, id);
  }
}
