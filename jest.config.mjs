export default {
    preset: "ts-jest",
    testEnvironment: "node",
    collectCoverageFrom: ["**/src/**/*.ts"],
    coverageReporters: ["json", "lcov", "text"],
    testMatch: ["**/src/**/*.spec.ts"],
};
