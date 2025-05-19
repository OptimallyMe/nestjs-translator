"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TranslatorModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslatorFilter = exports.TranslatorModule = exports.TranslatorService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const ReplaceStr = require("replace-string");
let TranslatorService = class TranslatorService {
    constructor(defaultLanguage, default_source, keyExtractor) {
        this.defaultLanguage = defaultLanguage;
        this.default_source = default_source;
        this.keyExtractor = keyExtractor;
        this.langs = {};
        this.findLangs();
        if (keyExtractor)
            this._keyExtractor = keyExtractor;
    }
    getLangs() {
        return Object.keys(this.langs);
    }
    getSourceFolderPath() {
        return path.join(__dirname, '../../', this.default_source);
    }
    findLangs() {
        const source = this.getSourceFolderPath();
        const folders = fs.readdirSync(source);
        folders.forEach((langFolder, i) => {
            try {
                const currentLangFolder = path.join(source, '/', langFolder);
                const files = fs.readdirSync(currentLangFolder);
                files.forEach(langFile => {
                    const currentLangFile = path.join(currentLangFolder, langFile);
                    try {
                        const content = JSON.parse(fs.readFileSync(currentLangFile, { encoding: 'utf8' }));
                        if (content) {
                            this.langs[langFolder] = Object.assign(Object.assign({}, this.langs[langFolder]), content);
                        }
                    }
                    catch (e) {
                        throw new Error(`Error on reading translation file : ${currentLangFile}\nThe file should be JSON format.`);
                    }
                });
            }
            catch (e) { }
        });
    }
    translate(key, options) {
        let lang = this.defaultLanguage;
        if (options && options.lang) {
            if (this.langs.hasOwnProperty(options.lang)) {
                lang = options.lang;
            }
            else {
                throw new Error(`Language "${options.lang}" not founded for key : "${key}"`);
            }
        }
        let replaceKeys = [];
        if (options && options.replace && typeof options.replace == 'object') {
            replaceKeys = Object.keys(options.replace);
        }
        let msg = key;
        if (this.langs[lang].hasOwnProperty(key)) {
            msg = this.langs[lang][key];
        }
        replaceKeys.forEach(key => {
            const value = options.replace[key];
            msg = ReplaceStr(msg, '${' + key + '}', value);
        });
        return msg;
    }
};
TranslatorService = __decorate([
    common_1.Injectable(),
    __param(0, common_1.Inject('DEFAULT_TRANSLATION_LANGUAGE')),
    __param(1, common_1.Inject('TRANSLATION_SOURCE')),
    __param(2, common_1.Inject('TRANSLATOR_REQUEST_KEY_EXTRACTOR')),
    __metadata("design:paramtypes", [String, String, Function])
], TranslatorService);
exports.TranslatorService = TranslatorService;
let TranslatorModule = TranslatorModule_1 = class TranslatorModule {
    static forRoot(options) {
        let global = false;
        if (options.hasOwnProperty('global'))
            global = options.global;
        let defaultLang = 'en';
        if (options.hasOwnProperty('defaultLang'))
            defaultLang = options.defaultLang;
        let translationSource = '/src/i18n';
        if (options.hasOwnProperty('translationSource'))
            translationSource = options.translationSource;
        let requestKeyExtractor = () => defaultLang;
        if (options.hasOwnProperty('requestKeyExtractor'))
            requestKeyExtractor = options.requestKeyExtractor;
        const Module = {
            global,
            module: TranslatorModule_1,
            providers: [
                {
                    provide: 'DEFAULT_TRANSLATION_LANGUAGE',
                    useValue: defaultLang
                },
                {
                    provide: 'TRANSLATION_SOURCE',
                    useValue: translationSource
                },
                {
                    provide: 'TRANSLATOR_REQUEST_KEY_EXTRACTOR',
                    useValue: requestKeyExtractor
                },
                TranslatorService,
            ],
            exports: [TranslatorService],
        };
        return Module;
    }
};
TranslatorModule = TranslatorModule_1 = __decorate([
    common_1.Module({})
], TranslatorModule);
exports.TranslatorModule = TranslatorModule;
let TranslatorFilter = class TranslatorFilter {
    constructor(translator) {
        this.translator = translator;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const req = ctx.getRequest();
        let status = common_1.HttpStatus.BAD_REQUEST;
        let message = exception.message;
        try {
            status = exception.getStatus();
        }
        catch (e) { }
        try {
            if (exception.response) {
                if (exception.response.message) {
                    message = exception.response.message;
                }
                if (exception.respone.statusCode) {
                    status = exception.respone.statusCode;
                }
            }
        }
        catch (e) { }
        let langKey;
        let selectedLanguage;
        if (this.translator._keyExtractor) {
            try {
                langKey = this.translator._keyExtractor(req);
            }
            catch (e) { }
        }
        if (typeof langKey == 'string') {
            const langs = this.translator.getLangs();
            if (langs.indexOf(langKey) > -1) {
                selectedLanguage = langKey;
            }
        }
        const translationOptions = selectedLanguage ? { lang: selectedLanguage } : {};
        if (Array.isArray(message)) {
            message = message.map(t => {
                return this.translator.translate(t, translationOptions);
            });
        }
        else if (typeof message == 'string') {
            message = this.translator.translate(message, translationOptions);
        }
        response.status(status).json({
            statusCode: status,
            message,
        });
    }
};
TranslatorFilter = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [TranslatorService])
], TranslatorFilter);
exports.TranslatorFilter = TranslatorFilter;
//# sourceMappingURL=index.js.map