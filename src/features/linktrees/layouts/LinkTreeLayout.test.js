import { describe, it, expect, vi, beforeEach } from "vitest";
import LinkTreeLayout from "./LinkTreeLayout.svelte";
import { renderWithProviders } from "../../../test-utils";
import apiHelper from "../../../helpers/apiHelper";
import { usersStore } from "../../users/states/usersStore";
import * as routerModule from "../../../router";

describe("LinkTreeLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Tanpa mock ini store akan memanggil API sungguhan dan hasilnya bergantung pada jaringan.
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(() => Promise.resolve());
  });

  it("should redirect to login if access token does not exist", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue(null);
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(LinkTreeLayout, { preloadedState: { profile: null } });

    expect(navSpy).toHaveBeenCalledWith("/auth/login");
    expect(usersStore.asyncSetProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Memuat sesi pengguna...");
  });

  it("should load profile when token exists", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");

    renderWithProviders(LinkTreeLayout, { preloadedState: { profile: null } });

    expect(usersStore.asyncSetProfile).toHaveBeenCalled();
  });

  it("should render navbar and sidebar, toggle sidebar, and trigger logout", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { wrapper, authStore } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: { id: 1, name: "Test User", email: "test@delcom.org" } },
    });
    const logoutSpy = vi.spyOn(authStore, "asyncSetIsAuthLogout").mockImplementation(() => {});

    expect(wrapper.text()).toContain("Delcom Link Tree");
    expect(wrapper.text()).toContain("Semua Link Tree");
    expect(wrapper.text()).toContain("Test User");

    await wrapper.find('[data-testid="toggle-sidebar-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(true);

    await wrapper.find('[data-testid="sidebar-backdrop"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);

    await wrapper.find('[data-testid="profile-dropdown-button"]').trigger("click");
    await wrapper.find('[data-testid="dropdown-logout-button"]').trigger("click");

    expect(logoutSpy).toHaveBeenCalled();
  });

  it("should stay on page when isProfile fires and profile exists", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: { id: 1, name: "Logged User" }, isProfile: false },
    });

    usersStore.setIsProfile(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.text()).toContain("Logged User");
    expect(putTokenSpy).not.toHaveBeenCalled();
  });

  it("should clear token and redirect when isProfile fires without profile", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    renderWithProviders(LinkTreeLayout, { preloadedState: { profile: null, isProfile: false } });

    usersStore.setIsProfile(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(putTokenSpy).toHaveBeenCalledWith("");
    expect(navSpy).toHaveBeenCalledWith("/auth/login");
  });

  it("should redirect to login after logout completes", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { authStore } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: { id: 1, name: "Logged User" }, isAuthLogout: false },
    });

    authStore.setIsAuthLogout(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(navSpy).toHaveBeenCalledWith("/auth/login");
  });
});
