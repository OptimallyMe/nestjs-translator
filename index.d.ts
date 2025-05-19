import { DynamicModule, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request } from 'express';
export declare class TranslatorService {
    private defaultLanguage;
    private readonly default_source;
    private readonly keyExtractor;
    readonly _keyExtractor: (req: any) => string | undefined;
    constructor(defaultLanguage: string, default_source: string, keyExtractor: (req: any) => string);
    private langs;
    getLangs(): string[];
    private getSourceFolderPath;
    private findLangs;
    translate(key: string, options?: {
        replace?: {
            [key: string]: string;
        };
        lang?: string;
    }): string;
}
interface TranslatorModuleOptionsInterface {
    defaultLang?: string;
    translationSource?: string;
    global?: boolean;
    requestKeyExtractor?: (req: Request | any) => string;
}
export declare class TranslatorModule {
    static forRoot(options: TranslatorModuleOptionsInterface): DynamicModule;
}
export declare class TranslatorFilter implements ExceptionFilter {
    private translator;
    constructor(translator: TranslatorService);
    catch(exception: HttpException | any, host: ArgumentsHost): void;
}
export {};
