using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ScorpiusLauncher
{
    public partial class LauncherForm : Form
    {
        private readonly string installDir;
        private readonly string startupScript;
        private Process backendProcess;
        private Process frontendProcess;
        private Process electronProcess;

        public LauncherForm()
        {
            InitializeComponent();
            installDir = Path.GetDirectoryName(Application.ExecutablePath);
            startupScript = Path.Combine(installDir, "scripts", "startupscorpius.bat");
            
            // Set up form
            this.Text = "Scorpius Cybersecurity Platform";
            this.Icon = new System.Drawing.Icon(Path.Combine(installDir, "assets", "scorpius-icon.ico"));
            this.WindowState = FormWindowState.Minimized;
            this.ShowInTaskbar = false;
            
            // Create system tray icon
            CreateSystemTrayIcon();
            
            // Auto-start the platform
            Task.Run(StartPlatform);
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            
            // LauncherForm
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(400, 300);
            this.Name = "LauncherForm";
            this.Text = "Scorpius Launcher";
            this.WindowState = FormWindowState.Minimized;
            this.Load += new System.EventHandler(this.LauncherForm_Load);
            
            this.ResumeLayout(false);
        }

        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;

        private void CreateSystemTrayIcon()
        {
            // Create context menu
            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("Open Web Dashboard", null, OpenWebDashboard);
            trayMenu.Items.Add("Open Desktop App", null, OpenDesktopApp);
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("View Logs", null, ViewLogs);
            trayMenu.Items.Add("Restart Services", null, RestartServices);
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("Exit", null, ExitApplication);

            // Create tray icon
            trayIcon = new NotifyIcon();
            trayIcon.Text = "Scorpius Cybersecurity Platform";
            trayIcon.Icon = this.Icon;
            trayIcon.ContextMenuStrip = trayMenu;
            trayIcon.Visible = true;
            trayIcon.DoubleClick += OpenWebDashboard;
        }

        private async Task StartPlatform()
        {
            try
            {
                ShowTrayNotification("Starting Scorpius Platform...", "Please wait while services initialize.", ToolTipIcon.Info);

                // Check if startup script exists
                if (!File.Exists(startupScript))
                {
                    ShowTrayNotification("Error", "Startup script not found. Please reinstall Scorpius.", ToolTipIcon.Error);
                    return;
                }

                // Start the platform using the batch script
                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c \"{startupScript}\"",
                    WorkingDirectory = installDir,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                Process process = Process.Start(startInfo);
                
                // Wait for services to start
                await Task.Delay(10000); // 10 seconds

                // Check if services are running
                bool servicesRunning = await CheckServicesHealth();
                
                if (servicesRunning)
                {
                    ShowTrayNotification("Scorpius Platform Ready", "All services started successfully. Click to open dashboard.", ToolTipIcon.Info);
                }
                else
                {
                    ShowTrayNotification("Service Warning", "Some services may not have started correctly. Check logs for details.", ToolTipIcon.Warning);
                }
            }
            catch (Exception ex)
            {
                ShowTrayNotification("Startup Error", $"Failed to start platform: {ex.Message}", ToolTipIcon.Error);
            }
        }

        private async Task<bool> CheckServicesHealth()
        {
            try
            {
                using (var client = new System.Net.Http.HttpClient())
                {
                    client.Timeout = TimeSpan.FromSeconds(5);
                    
                    // Check backend health
                    var backendResponse = await client.GetAsync("http://localhost:8000/health");
                    if (!backendResponse.IsSuccessStatusCode)
                        return false;

                    // Check frontend availability
                    var frontendResponse = await client.GetAsync("http://localhost:8080");
                    if (!frontendResponse.IsSuccessStatusCode)
                        return false;

                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        private void ShowTrayNotification(string title, string message, ToolTipIcon icon)
        {
            if (trayIcon != null)
            {
                trayIcon.ShowBalloonTip(5000, title, message, icon);
            }
        }

        private void OpenWebDashboard(object sender, EventArgs e)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "http://localhost:8080",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open web dashboard: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void OpenDesktopApp(object sender, EventArgs e)
        {
            try
            {
                string electronPath = Path.Combine(installDir, "node_modules", ".bin", "electron.cmd");
                string electronMain = Path.Combine(installDir, "electron", "main.js");

                if (File.Exists(electronPath) && File.Exists(electronMain))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = electronPath,
                        Arguments = $"\"{electronMain}\"",
                        WorkingDirectory = installDir,
                        UseShellExecute = false
                    });
                }
                else
                {
                    // Fallback to npm run electron
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm run electron",
                        WorkingDirectory = installDir,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open desktop app: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void ViewLogs(object sender, EventArgs e)
        {
            try
            {
                string logFile = Path.Combine(installDir, "logs", "scorpius.log");
                if (File.Exists(logFile))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "notepad.exe",
                        Arguments = $"\"{logFile}\"",
                        UseShellExecute = false
                    });
                }
                else
                {
                    MessageBox.Show("Log file not found.", "Information", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open logs: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async void RestartServices(object sender, EventArgs e)
        {
            try
            {
                ShowTrayNotification("Restarting Services", "Stopping and restarting all Scorpius services...", ToolTipIcon.Info);

                // Kill existing processes
                foreach (var process in Process.GetProcessesByName("node"))
                {
                    try { process.Kill(); } catch { }
                }
                foreach (var process in Process.GetProcessesByName("python"))
                {
                    try { process.Kill(); } catch { }
                }

                // Wait a moment
                await Task.Delay(3000);

                // Restart platform
                await StartPlatform();
            }
            catch (Exception ex)
            {
                ShowTrayNotification("Restart Error", $"Failed to restart services: {ex.Message}", ToolTipIcon.Error);
            }
        }

        private void ExitApplication(object sender, EventArgs e)
        {
            // Stop all processes
            try
            {
                foreach (var process in Process.GetProcessesByName("node"))
                {
                    try { process.Kill(); } catch { }
                }
                foreach (var process in Process.GetProcessesByName("python"))
                {
                    try { process.Kill(); } catch { }
                }
            }
            catch { }

            // Exit application
            trayIcon.Visible = false;
            Application.Exit();
        }

        private void LauncherForm_Load(object sender, EventArgs e)
        {
            // Hide form on load
            this.Hide();
        }

        protected override void SetVisibleCore(bool value)
        {
            // Keep form hidden
            base.SetVisibleCore(false);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                trayIcon?.Dispose();
                trayMenu?.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LauncherForm());
        }
    }
}
