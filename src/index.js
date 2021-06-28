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

		for (let [key, value] of Object.entries(defaultTranslations.translations[""])) {
			if (!value.msgid) {
				continue;
			}

			try {
				let translation = await translate(value.msgid, {to: args.lang});
				value.msgstr = translation.text;
			} catch (e) {
				console.error("String: " + value.msgid + " could not be translated.");
				console.error(e);
				continue;
			}
		}

		let poOutput = parser.po.compile(defaultTranslations);
		fs.writeFileSync(args.output + ".po", poOutput);
	}
}

LangFilesTranslatorCommand.description = `CLI Tool to Translate .pot or .po Files automaticly with Google Translate`;

LangFilesTranslatorCommand.flags = {
	version: flags.version({char: "v"}),
	help: flags.help({char: "h"}),
};

module.exports = LangFilesTranslatorCommand;
