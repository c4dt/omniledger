/**
 * @file Library to ease file I/O using promises.
 */

const FileSystem = require("tns-core-modules/file-system");
export const Documents = FileSystem.knownFolders.documents();
import Log from "~/lib/cothority/log";

export class FileIO {

    /**
     * Gets the string of the file at filePath and returns a promise with the content.
     * @param {string} filePath - the path to the file
     * @returns {Promise} - a promise that gets resolved once the content of the file has been read
     */
    static async readFile(filePath: string): Promise<string> {
        let str = "";
        try {
            str = await Documents.getFile(filePath).readText();
            Log.lvl2("read file", filePath);
        } catch (error) {
            // await this.lslr("");
            return Log.rcatch(error, "Reading error");
        }
        return str;
    }

    /**
     * Writes the parameter string to the file at filePath. This method overwrites the file completely.
     * @param {string} filePath - the path to the file
     * @param {string} string - the string to write
     * @returns {Promise} - a promise that gets resolved once the content has been written to the file
     */
    static async writeFile(filePath: string, content: string): Promise<void> {
        Log.lvl2("writing to: " + filePath);
        try {
            await Documents.getFile(filePath).writeText(content);
        } catch (error) {
            // await this.lslr(filePath);
            Log.catch("WRITING ERROR:", error);
        }
    }

    /**
     * Execute a given function on each element of a folder.
     * @param {string} folder - the path to the folder
     * @param {function} closure - the function that will be exeuted on each element. It has to be of type
     * statuc (elementName: string)
     */
    static forEachFolderElement(folder: string, closure: any) {
        Documents.getFolder(folder).eachEntity(function (entity) {
            closure(entity);
            // continue until the last file
            return true;
        })
    }

    /**
     * Remove the specified fodler
     * @param {string} folder
     * @retuns {Promise} - a promise that gets resolved once the folder has been deleted
     */
    static async removeFolder(folder: string): Promise<void> {
        try {
            await Documents.getFolder(folder).remove();
        } catch (error) {
            Log.catch(error, "REMOVING ERROR :");
        }
    }

    /**
     * Removes the directory recursively, but only files directly inside and the directory itself. If there
     * are subdirectories, this will fail.
     * @param dir
     * @returns {Promise<void>}
     */
    static async rmrf(dir: string): Promise<void> {
        await Documents.getFolder(dir).clear();
    }

    /**
     * Lists a directory recursively.
     * @param dir the directory to list
     * @param rec internal parameter for recursive search
     */
    static async lslr(dir: string, rec = false): Promise<void> {
        if (!rec) {
            dir = FileSystem.path.join(Documents.path, dir);
        }
        let folders = [];
        let files = [];
        let entities = await FileSystem.Folder.fromPath(dir).getEntities();
        // entities is array with the document's files and folders.
        entities.forEach((entity) => {
            const fullPath = entity.path;
            // const fullPath = FileSystem.path.join(entity.path, entity.name);
            const isFolder = FileSystem.Folder.exists(fullPath);
            const e = {
                name: entity.name,
                path: entity.path,
            };
            if (isFolder) {
                folders.push(e);
            } else {
                files.push(e);
            }
        });
        Log.lvl2("");
        Log.lvl2("Directory:", dir);
        folders.forEach(folder => {
            Log.lvl2("d ", folder.name);
        });
        files.forEach(file => {
            Log.lvl2("f ", file.name);
        });
        folders.forEach(folder => {
            this.lslr(folder.path, true);
        });
    }

    /**
     * Returns true if the folder exists.
     * @param path
     */
    static folderExists(path): boolean {
        return FileSystem.Folder.exists(FileSystem.path.join(Documents.path, path));
    }

    /**
     * Returns true if the file exists
     * @param path
     */
    static fileExists(path): boolean {
        return FileSystem.Folder.exists(FileSystem.path.join(Documents.path, path));
    }
}
