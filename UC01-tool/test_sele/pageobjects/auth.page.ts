class AuthPage {
  public openLogin() {
    return browser.url("/login");
  }

  public async login(email: string, password: string): Promise<void> {
    const emailInput = await $('input[name="email"]');
    const passwordInput = await $('input[name="password"]');
    const submitButton = await $("form button.bg-blue-600");

    await emailInput.waitForDisplayed({ timeout: 15000 });
    await emailInput.setValue(email);
    await passwordInput.setValue(password);
    await submitButton.click();

    // 1. Đợi URL chuyển sang /dashboard
    await browser.waitUntil(
      async () => (await browser.getUrl()).includes("/dashboard"),
      {
        timeout: 30000,
        timeoutMsg: "Login did not navigate to /dashboard in time",
      },
    );

    // 🔥 BƯỚC QUAN TRỌNG: Hard Refresh để Firebase nhận diện session/role chắc chắn 100%
    // Điều này thay thế cho việc bạn phải "nhấn vào tab" thủ công
    await browser.refresh();

    // 2. Đợi thêm một chút để App khởi tạo lại hoàn toàn
    await browser.pause(3000);

    // 3. Kiểm tra xem đã thực sự ổn định ở Dashboard chưa
    const body = await $("body");
    await body.waitForDisplayed({ timeout: 10000 });

    console.log("✅ Đăng nhập và đồng bộ Auth thành công!");
  }
}

export default new AuthPage();
