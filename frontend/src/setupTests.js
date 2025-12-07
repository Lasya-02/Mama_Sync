import '@testing-library/jest-dom';

// ✅ Global sessionStorage mock (runs BEFORE components import)
Object.defineProperty(window, "sessionStorage", {
  value: {
    store: {
      userdata: JSON.stringify({ name: "TestUser" }),
    },
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value;
    },
    clear() {
      this.store = {};
    },
  },
});

// ✅ Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// ✅ Mock AuthContext
jest.mock("./contexts/AuthContext", () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));
