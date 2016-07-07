import {CommandInputParameter} from "../../mappings/draft-4/CommandInputParameter";
import {CommandLineInjectable} from "../interfaces/CommandLineInjectable";
import {CommandLinePart} from "../helpers/CommandLinePart";
import {CWLType} from "../../mappings/draft-4/CWLType";
import {CommandInputRecordSchema} from "../../mappings/draft-4/CommandInputRecordSchema";
import {CommandInputEnumSchema} from "../../mappings/draft-4/CommandInputEnumSchema";
import {CommandInputArraySchema} from "../../mappings/draft-4/CommandInputArraySchema";
import {CommandLineBinding} from "../../mappings/draft-4/CommandLineBinding";
import {Expression} from "../../mappings/draft-4/Expression";
import {Identifiable} from "../interfaces/Identifiable";
import {TypeResolver} from "../helpers/TypeResolver";
import {CommandInputRecordField} from "../../mappings/draft-4/CommandInputRecordField";


export class CommandInputParameterModel implements CommandInputParameter, CommandLineInjectable, Identifiable {
    id: string;

    isRequired: boolean = true;
    items: string;
    fields: Array<CommandInputParameterModel>;
    resolvedType: string;

    type: CWLType | CommandInputRecordSchema | CommandInputEnumSchema | CommandInputArraySchema | string | Array<CWLType | CommandInputRecordSchema | CommandInputEnumSchema | CommandInputArraySchema | string>;
    inputBinding: CommandLineBinding;
    label: string;
    description: string;
    secondaryFiles: string | Expression | Array<string | Expression>;
    format: string | Array<string> | Expression;
    streamable: boolean;

    constructor(attr: CommandInputParameter | CommandInputRecordField) {
        if ((<CommandInputRecordField> attr).name) {
            this.id           = (<CommandInputRecordField> attr).name;
            this.type         = attr.type || null;
            this.inputBinding = attr.inputBinding || null;
        } else {
            this.id             = (<CommandInputParameter> attr).id;
            this.type           = attr.type || null;
            this.inputBinding   = attr.inputBinding || null;
            this.label          = (<CommandInputParameter> attr).label || null;
            this.description    = (<CommandInputParameter> attr).description || null;
            this.secondaryFiles = (<CommandInputParameter> attr).secondaryFiles || null;
            this.format         = (<CommandInputParameter> attr).format || null;
            this.streamable     = (<CommandInputParameter> attr).streamable || null;
        }


        let typeResolution = TypeResolver.resolveType(this.type);

        this.resolvedType = typeResolution.type;

        // create CommandInputParameterModel from fields, so they can generate their own command line
        this.fields = typeResolution.fields ? typeResolution.fields.map(field => {
            return new CommandInputParameterModel(field);
        }) : typeResolution.fields;

        if (typeResolution.items) {
            // in case there are items, resolve their type
            let resolvedItems = TypeResolver.resolveType(typeResolution.items);

            this.items = resolvedItems.type;
            // if items is type record, resolve their fields to CommandInputParameterModel, for cmd
            if (resolvedItems.fields) {
                this.fields = resolvedItems.fields.map(field => new CommandInputParameterModel(field));
            }
        } else {
            this.items = null;
        }

        this.isRequired = typeResolution.isRequired;
    }

    getCommandPart(job?: any, value?: any, self?: any): CommandLinePart {

        // only include if they have command line binding
        if (!this.inputBinding) {
            return null;
        }

        // If type declared does not match type of value, throw error
        if (!TypeResolver.doesTypeMatch(this.resolvedType, value)) {
            // If there are items, only throw exception if items don't match either
            if (!this.items || !TypeResolver.doesTypeMatch(this.items, value)) {
                throw("Mismatched value and type definition");
            }
        }

        let prefix    = this.inputBinding.prefix || "";
        let separator = (!!prefix && this.inputBinding.separate !== false) ? " " : "";
        let position  = this.inputBinding.position || 0;

        // array
        if (Array.isArray(value)) {
            let parts                   = value.map(val => this.getCommandPart(job, val));
            let calculatedValue: string = '';

            parts.sort(this.sortingKeySort);

            parts.forEach(part => {
                calculatedValue += " " + part.value;
            });

            // if array has itemSeparator, resolve as --prefix [separate] value1(delimiter) value2(delimiter) value3
            if (this.inputBinding.itemSeparator) {
                calculatedValue = prefix + separator + parts.map((val) => {
                        return val.value;
                        // return this.resolveValue(job, val, this.inputBinding);
                    }).join(this.inputBinding.itemSeparator + " ");

                // no separator, resolve as --prefix [separate] value1 --prefix [separate] value2 --prefix [separate] value3
            } else {
                calculatedValue = parts.map((val) => {
                    return prefix + separator + val.value;
                }).join(" ");
            }

            return new CommandLinePart(calculatedValue, position);
        }

        // record
        if (typeof value === "object") {
            // make sure object isn't a file, resolveValue handles files
            if (!value.path) {
                // evaluate record by calling generate part for each field
                let parts = this.fields.map((field) => field.getCommandPart(job, value[field.id]));
                parts.sort(this.sortingKeySort);

                let calculatedValue: string = '';

                parts.forEach((part) => {
                    calculatedValue += " " + part.value;
                });

                return new CommandLinePart(calculatedValue, position);
            }
        }

        // not record or array
        // if the input has items, this is a recursive call and prefix should not be added again
        prefix              = this.items ? '' : prefix;
        let calculatedValue = prefix + separator + this.resolveValue(job, value, this.inputBinding);
        return new CommandLinePart(calculatedValue, position);
    }

    private resolveValue(job: any, value: any, inputBinding: CommandLineBinding) {
        //@todo(maya): implement expression evaluation
        if (value.path) {
            value = value.path;
        }

        return value;
    }

    toString(): string {
        return JSON.stringify(this, null, 4);
    }

    //@todo(maya): implement MSD radix sort for sorting key
    private sortingKeySort(a: CommandLinePart, b: CommandLinePart) {
        if (a.sortingKey[0] < b.sortingKey[0]) {
            return -1;
        }
        if (a.sortingKey[0] > b.sortingKey[0]) {
            return 1;
        }
        return 0;
    }
}
