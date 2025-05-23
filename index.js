import inquirer from "inquirer";
import qr from "qr-image";
import fs from "fs";

// 1. Use the inquirer npm package to get user input.
inquirer
    .prompt([
        {
            message: "Type in your URL",
            name: "URL", // Corrected 'Name' to 'name'
        },
        {
            message: "Type the file name for the QR code",
            name: "fileName", // Added a prompt to ask for the file name
        },
    ])
    .then((answers) => {
        const url = answers.URL;
        const fileName = answers.fileName;

        // 2. Use the qr-image npm package to turn the user entered URL into a QR code image.
        var qr_svg = qr.image(url);
        
        // Save the QR code as an image file
        qr_svg.pipe(fs.createWriteStream(`${fileName}.png`));

        // 3. Create a txt file to save the user input using the native fs node module.
        fs.writeFileSync("user_input.txt", `URL: ${url}`);
        console.log("QR code and URL saved successfully!");
    })
    .catch((error) => {
        if (error.isTtyError) {
            // Prompt couldn't be rendered in the current environment
        } else {
            // Something else went wrong
        }
    });
