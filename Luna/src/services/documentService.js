const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_CHARS = 60000;
let pdfJsPromise;

function loadPdfJs() {
    if (!pdfJsPromise) {
        pdfJsPromise = Promise.all([
            import("pdfjs-dist"),
            import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
        ]).then(([pdfjsLib, workerModule]) => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
            return pdfjsLib;
        });
    }

    return pdfJsPromise;
}

function prepareDocument(name, content) {
    const truncated = content.length > MAX_DOCUMENT_CHARS;
    return {
        name,
        content: truncated ? content.slice(0, MAX_DOCUMENT_CHARS) : content,
        truncated,
    };
}


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

            resolve(prepareDocument(file.name, content));

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

        const pdfjsLib = await loadPdfJs();

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

            if (fullText.length > MAX_DOCUMENT_CHARS) {
                break;
            }

        }

        if (!fullText.trim()) {

            throw new Error(
                "No readable text was found in this PDF."
            );

        }

        return prepareDocument(file.name, fullText);

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
    // Keep browser parsing bounded while allowing normal PDFs.
    // ==============================

    if (file.size > MAX_FILE_SIZE) {

        throw new Error(
            "File is too large. Please upload a file smaller than 5 MB."
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
