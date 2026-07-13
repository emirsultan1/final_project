import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.*;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class StudySyncTest {

    private static final String BASE_URL = "http://localhost:3000";
    private static final String EMAIL = "test@user.com";
    private static final String PASSWORD = "eglXxo12";

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeAll
    static void setupDriver() {
        WebDriverManager.chromedriver().setup();
    }

    @BeforeEach
    void startBrowser() {
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterEach
    void stopBrowser() {
        if (driver != null) driver.quit();
    }

    private void login() {
        driver.get(BASE_URL + "/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='login-email']"))).sendKeys(EMAIL);
        driver.findElement(By.cssSelector("[data-testid='login-password']")).sendKeys(PASSWORD);
        driver.findElement(By.cssSelector("[data-testid='login-submit']")).click();
        // Successful login navigates to "/" and the sidebar appears
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("sidebar")));
    }

    @Test
    @Order(1)
    @DisplayName("TC-01: User can log in with valid credentials")
    void testLogin() {
        login();
        assertTrue(driver.getCurrentUrl().equals(BASE_URL + "/")
                        || driver.getCurrentUrl().startsWith(BASE_URL),
                "Should be redirected to dashboard after login");
        assertFalse(driver.getPageSource().contains("Login failed"),
                "No login error should be shown");
    }

    @Test
    @Order(2)
    @DisplayName("TC-02: Pomodoro timer starts and can be paused")
    void testPomodoroStartPause() {
        login();
        driver.get(BASE_URL + "/timer");

        var startBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("[data-testid='timer-start']")));
        String timeBefore = driver.findElement(
                By.cssSelector("[data-testid='timer-display']")).getText();
        startBtn.click();

        // After starting, the Pause button should appear
        var pauseBtn = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='timer-pause']")));
        assertTrue(pauseBtn.isDisplayed(), "Pause button should appear after starting");

        // Timer should actually tick down
        wait.until(d -> !d.findElement(
                By.cssSelector("[data-testid='timer-display']")).getText().equals(timeBefore));

        pauseBtn.click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='timer-start']")));
    }

    @Test
    @Order(3)
    @DisplayName("TC-03: Tasks page loads for an authenticated user")
    void testTasksPageLoads() {
        login();
        driver.get(BASE_URL + "/tasks");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("h1")));
        assertFalse(driver.getPageSource().contains("Failed to load tasks"),
                "Tasks should load without an error message");
    }

    @Test
    @Order(4)
    @DisplayName("TC-04: Analytics page renders charts")
    void testAnalyticsRenders() {
        login();
        driver.get(BASE_URL + "/analytics");
        // Chart.js renders into <canvas> elements
        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("canvas")));
        assertFalse(driver.findElements(By.tagName("canvas")).isEmpty(),
                "At least one chart canvas should render on Analytics");
    }
}