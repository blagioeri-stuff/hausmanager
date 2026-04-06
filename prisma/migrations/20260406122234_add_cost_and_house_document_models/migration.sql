-- CreateTable
CREATE TABLE "Cost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountChf" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "recurrence" TEXT,
    "componentId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cost_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "HomeComponent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HouseDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filename" TEXT,
    "storedName" TEXT,
    "externalUrl" TEXT,
    "componentId" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HouseDocument_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "HomeComponent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
