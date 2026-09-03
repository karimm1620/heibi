/* eslint-disable import/first -- the theme hook mock must be registered before import. */
jest.mock("../../theme/useTheme", () => ({ useTheme: jest.fn() }));

import { resolvePressFeedback } from "../pressFeedback";
import type { ThemeStateTokens } from "../../theme/contracts";

const states: ThemeStateTokens = {
  disabledOpacity: 0.38,
  pressedOpacity: 0.82,
  pressedScale: 0.97,
  rippleOpacity: 0.12,
  minTouchTarget: 48,
};

describe("Android press feedback", () => {
  it("uses a clipped semantic background ripple for Material controls", () => {
    const feedback = resolvePressFeedback({
      visualTheme: "material3",
      states,
      color: "#123456",
      radius: 24,
    });

    expect(feedback.androidRipple).toEqual({
      color: "#1234561F",
      borderless: false,
      foreground: false,
      radius: 24,
    });
    expect(feedback.opacity(true)).toBe(1);
  });

  it("uses opacity without an Android ripple for Liquid controls", () => {
    const feedback = resolvePressFeedback({
      visualTheme: "liquid",
      states,
      color: "#123456",
    });

    expect(feedback.androidRipple).toBeUndefined();
    expect(feedback.opacity(true)).toBe(states.pressedOpacity);
  });

  it("supports one restrained foreground ripple for bounded navigation feedback", () => {
    const feedback = resolvePressFeedback({
      visualTheme: "material3",
      states,
      color: "#123456",
      foreground: true,
      radius: 16,
      rippleOpacity: 0.06,
    });

    expect(feedback.androidRipple).toEqual({
      color: "#1234560F",
      borderless: false,
      foreground: true,
      radius: 16,
    });
    expect(feedback.opacity(true)).toBe(1);
  });

  it("suppresses feedback and exposes disabled opacity when blocked", () => {
    const feedback = resolvePressFeedback({
      visualTheme: "material3",
      states,
      color: "#FFFFFF",
      disabled: true,
    });

    expect(feedback.androidRipple).toBeUndefined();
    expect(feedback.opacity(true)).toBe(states.disabledOpacity);
  });
});
