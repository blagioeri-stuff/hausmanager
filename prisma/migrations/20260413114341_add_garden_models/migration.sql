-- CreateTable
CREATE TABLE "GardenPlant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latinName" TEXT,
    "typeKey" TEXT NOT NULL,
    "locationHint" TEXT,
    "posX" REAL,
    "posY" REAL,
    "plantedYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'gut',
    "winterProtection" BOOLEAN NOT NULL DEFAULT false,
    "wateringIntervalDays" INTEGER,
    "fertilizingWeeks" INTEGER,
    "pruningMonths" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GardenElement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "posX" REAL,
    "posY" REAL,
    "sizeM2" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GardenPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storedName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "notes" TEXT,
    "plantId" TEXT,
    "elementId" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GardenPhoto_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "GardenPlant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GardenPhoto_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "GardenElement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GardenTodo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueMonth" INTEGER,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT NOT NULL DEFAULT 'pflege',
    "plantId" TEXT,
    "elementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GardenTodo_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "GardenPlant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GardenTodo_elementId_fkey" FOREIGN KEY ("elementId") REFERENCES "GardenElement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
