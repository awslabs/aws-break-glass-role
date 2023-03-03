const { writeFile, mkdir } = require('fs');
const { join } = require('path');
const homedir = require('os').homedir();

module.exports = () => {
    const path = join(homedir, '.aws')
    const template = `
        [integ]
        aws_access_key_id=${process.env.AWS_ACCESS_KEY_ID}
        aws_secret_access_key=${process.env.AWS_SECRET_ACCESS_KEY}
    `

    return new Promise((res,rej) => {
        mkdir(path, err => {
            if (err) {
                rej();
                throw err;
            }
            writeFile(join(path, 'credentials'), template, err => {
                if (err) {
                    rej();
                    throw err;
                }
                console.log("Credentials File Created");
                res();
            })
        });
    });
}