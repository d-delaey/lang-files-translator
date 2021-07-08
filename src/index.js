const {Command, flags} = require("@oclif/command");
const parser = require("gettext-parser");
const fs = require("fs");
const translate = require("@vitalets/google-translate-api");

class LangFilesTranslatorCommand extends Command {
	static args = [
		{
			name: "file",
			description: "Language File (.pot) that will be translated",
			required: true,
		},
		{name: "output", description: "Output File Name", required: true},
		{
			name: "lang",
			description: "Language to be translated into",
			required: true,
		},
	];

	async run() {
		const {args} = this.parse(LangFilesTranslatorCommand);

		let file = fs.readFileSync(args.file);
		let defaultTranslations = parser.po.parse(file);

		defaultTranslations.headers.Language = args.lang + "\n";
		defaultTranslations.headers["X-Generator"] = "Lang File Translator https://github.com/d-delaey/lang-files-translator";
		let translationToResolve = [];

		for await (let [key, value] of Object.entries(defaultTranslations.translations[""])) {
			if (!value.msgid) {
				continue;
			}

			try {
				translationToResolve.push(translate(value.msgid, {to: args.lang, client: "gtx"}));
			} catch (e) {
				translationToResolve.push(new Promise());
				console.error("String: " + value.msgid + " could not be translated.");
				console.error(e);
				continue;
			}
		}

		await Promise.all(translationToResolve).then((result) => {
			result.forEach((element, index) => {
				let translation = Object.keys(defaultTranslations.translations[""])[index + 1];
				if (translation) {
					defaultTranslations.translations[""][translation].msgstr = element.text;
				}
			});
		});

		console.info("Creating PO File...");
		let poOutput = parser.po.compile(defaultTranslations);
		fs.writeFileSync(args.output + ".po", poOutput);

		console.info("Creating MO File...");
		let moOutput = parser.mo.compile(defaultTranslations.translations);
		fs.writeFileSync(args.output + ".mo", moOutput);
	}
}

LangFilesTranslatorCommand.description = `CLI Tool to Translate .pot or .po Files automaticly with Google Translate`;

LangFilesTranslatorCommand.flags = {
	version: flags.version({char: "v"}),
	help: flags.help({char: "h"}),
};

module.exports = LangFilesTranslatorCommand;
