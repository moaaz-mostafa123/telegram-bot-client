#include <webview/webview.h>

#include <filesystem>
#include <string>

#ifdef _WIN32

#include <windows.h>

std::filesystem::path getExecutableDirectory() {
    std::wstring buffer;
    DWORD size = 260;

    while (true) {
        buffer.resize(size);

        DWORD length = GetModuleFileNameW(
            nullptr,
            buffer.data(),
            size
        );

        if (length == 0) {
            return {};
        }

        if (length < size - 1) {
            buffer.resize(length);
            break;
        }

        size *= 2;
    }

    return std::filesystem::path(buffer).parent_path();
}

#elif defined(__linux__)

#include <unistd.h>
#include <limits.h>

std::filesystem::path getExecutableDirectory() {
    char buffer[PATH_MAX];

    ssize_t length = readlink(
        "/proc/self/exe",
        buffer,
        sizeof(buffer) - 1
    );

    if (length <= 0) {
        return {};
    }

    buffer[length] = '\0';

    return std::filesystem::path(buffer).parent_path();
}

#elif defined(__APPLE__)

#include <mach-o/dyld.h>

std::filesystem::path getExecutableDirectory() {
    uint32_t size = 0;

    _NSGetExecutablePath(nullptr, &size);

    std::string buffer(size, '\0');

    if (_NSGetExecutablePath(
            buffer.data(),
            &size
        ) != 0) {
        return {};
    }

    return std::filesystem::path(buffer).parent_path();
}

#else

#error "Unsupported platform"

#endif


int main() {
    webview::webview w(false, nullptr);

    w.set_title("Telegram Bot Client");
    w.set_size(1000, 600, WEBVIEW_HINT_NONE);

    auto exeDir = getExecutableDirectory();

    auto htmlPath = std::filesystem::weakly_canonical(exeDir / "assets/index.html");

    std::string url =
        "file://" + htmlPath.generic_string();

#ifdef _WIN32
    url = "file:///" + htmlPath.generic_string();
#endif

    w.navigate(url);

    w.run();
    return 0;
}