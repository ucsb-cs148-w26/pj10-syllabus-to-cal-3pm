import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
    dir: './',
});

const config : Config = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jest-environment-node',

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    testMatch: [
        '**/tests/**/*.test.ts',
        '**/tests/**/*.test.tsx',
    ],

    collectCoverageFrom: [
        '/lib/**/*.ts',
        'src/app/api/**/*.ts',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
};

export default createJestConfig(config);