import { Router } from "express";
import { PrismaClient } from "@prisma/client";

export const router = Router();
export const prisma = new PrismaClient();
