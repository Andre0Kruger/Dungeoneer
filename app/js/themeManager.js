const pathModule = require("path");

class ThemeManager {
    constructor() {
        this.THEME_PATH = pathModule.join(window.api.getAppPath(), "app", "css", "themes");
        this.BASE_CSS_PATH = pathModule.join(window.api.getAppPath(), "app", "css");
    }

    async getThemes() {
        var themes = await readdir(this.THEME_PATH);
        return themes;
    }

    rootStyles() {}

    initThemeFile(selectedTheme) {
        console.log("Init theme file");

        var themePath = pathModule.join(this.THEME_PATH, selectedTheme, "theme.css");
        var writePath = pathModule.join(this.BASE_CSS_PATH, "theme.css");
        fs.createReadStream(themePath).pipe(fs.createWriteStream(writePath));
    }
}
var instance = new ThemeManager();
module.exports = instance;
