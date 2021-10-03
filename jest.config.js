module.exports = {
  testEnvironment: "jsdom",
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
};