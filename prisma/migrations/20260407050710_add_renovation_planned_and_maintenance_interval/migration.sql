-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HomeComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "buildYear" INTEGER NOT NULL,
    "customCostChf" REAL,
    "customLifetimeYrs" INTEGER,
    "plannedRenovationYear" INTEGER,
    "plannedRenovationCostChf" REAL,
    "notes" TEXT,
    "renovationPlanned" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceIntervalMonths" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_HomeComponent" ("buildYear", "createdAt", "customCostChf", "customLifetimeYrs", "id", "name", "notes", "plannedRenovationCostChf", "plannedRenovationYear", "typeKey", "updatedAt") SELECT "buildYear", "createdAt", "customCostChf", "customLifetimeYrs", "id", "name", "notes", "plannedRenovationCostChf", "plannedRenovationYear", "typeKey", "updatedAt" FROM "HomeComponent";
DROP TABLE "HomeComponent";
ALTER TABLE "new_HomeComponent" RENAME TO "HomeComponent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
