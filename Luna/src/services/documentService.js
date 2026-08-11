import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const MAX_FILE_SIZE = 100 * 1024;


// ==============================
// Read TXT
// ==============================

function readTxtFile(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = (event) => {

            const content = event.target.result;

            if (!content.trim()) {

                reject(
                    new Error("The selected file is empty.")
                );

                return;
            }

            resolve({
                name: file.name,
                content: content,
            });

        };

        reader.onerror = () => {

            reject(
                new Error("Unable to read the TXT file.")
            );

        };

        reader.readAsText(file);

    });

}


// ==============================
// Read PDF
// ==============================

async function readPdfFile(file) {

    try {

        const arrayBuffer =
            await file.arrayBuffer();

        const pdf =
            await pdfjsLib.getDocument({
                data: arrayBuffer,
            }).promise;

        let fullText = "";

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            const page =
                await pdf.getPage(pageNumber);

            const textContent =
                await page.getTextContent();

            const pageText =
                textContent.items
                    .map(item => item.str || "")
                    .join(" ");

            fullText +=
                `\n\n--- Page ${pageNumber} ---\n\n${pageText}`;

        }

        if (!fullText.trim()) {

            throw new Error(
                "No readable text was found in this PDF."
            );

        }

        return {
            name: file.name,
            content: fullText,
        };

    } catch (error) {

        console.error(
            "PDF ERROR:",
            error
        );

        // Keep the actual error visible during development
        throw error;

    }

}


// ==============================
// Main Reader
// ==============================

export async function readDocument(file) {

    if (!file) {

        throw new Error(
            "No file selected."
        );

    }


    // ==============================
    // 100 KB LIMIT
    // ==============================

    if (file.size > MAX_FILE_SIZE) {

        throw new Error(
            "File is too large. Please upload a file smaller than 100 KB."
        );

    }


    const fileName =
        file.name.toLowerCase();


    // ==============================
    // TXT
    // ==============================

    if (
        file.type === "text/plain" ||
        fileName.endsWith(".txt")
    ) {

        return await readTxtFile(file);

    }


    // ==============================
    // PDF
    // ==============================

    if (
        file.type === "application/pdf" ||
        fileName.endsWith(".pdf")
    ) {

        return await readPdfFile(file);

    }


    throw new Error(
        "Unsupported file type. Please upload a TXT or PDF file."
    );

}