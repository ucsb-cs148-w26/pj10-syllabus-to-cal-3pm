import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    'next/server': '<rootDir>/__mocks__/next-server.ts',
  }
};

export default createJestConfig(customJestConfig);