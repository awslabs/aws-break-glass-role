const { existsSync, rm } = require('fs')
const { join } = require('path');

module.exports = () => {
    const src = join(process.cwd(), 'src');
    if (existsSync(src)) {
        rm(src,  { 
            recursive: true, 
            force: true 
        }, err => {
            if (err) throw err;
            else {
                console.log("Src directory removed, proceeding to build");
            }
        });
    } else {
        console.log("No src directory found, proceeding to build");
    }
}