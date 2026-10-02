import { definePrismaConfig } from "prisma/config";
import { defineConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: defineConfig({ contract: "./prisma/schema.prisma" }),
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});
