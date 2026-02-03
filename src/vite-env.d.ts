/// <reference types="vite/client" />

declare module "pptx-parser" {
    export default function parse(file: File, options?: { flattenGroup?: boolean }): Promise<unknown>
}

// File System API types for drag and drop folder support
interface FileSystemEntry {
    readonly isFile: boolean;
    readonly isDirectory: boolean;
    readonly name: string;
    readonly fullPath: string;
    readonly filesystem: FileSystem;
}

interface FileSystemDirectoryEntry extends FileSystemEntry {
    readonly isDirectory: true;
    readonly isFile: false;
    createReader(): FileSystemDirectoryReader;
}

interface FileSystemFileEntry extends FileSystemEntry {
    readonly isDirectory: false;
    readonly isFile: true;
    file(successCallback: (file: File) => void, errorCallback?: (error: Error) => void): void;
}

interface FileSystemDirectoryReader {
    readEntries(successCallback: (entries: FileSystemEntry[]) => void, errorCallback?: (error: Error) => void): void;
}

interface FileSystem {
    readonly name: string;
    readonly root: FileSystemDirectoryEntry;
}
