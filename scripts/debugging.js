/**
 * Helper function to get editor annotations asynchronously.
 * It sets the CSS value in the editor and waits for annotations to update.
 *
 * @param {object} editorSession The Ace Editor session.
 * @param {string} cssToTest The CSS string to test.
 * @param {string} [sampleKeyForLog=""] Optional key for logging, to aid debugging.
 * @param {number} [timeoutMs=300] Timeout in milliseconds to wait for annotations.
 * @returns {Promise<Array>} A promise that resolves with an array of error annotations.
 */
async function getEditorAnnotations(editorSession, cssToTest, sampleKeyForLog = "", timeoutMs = 300) {
    return new Promise((resolve) => {
        let resolved = false;
        let eventHandlerRef = null; 

        const finalizeResolution = (annotations) => {
            if (resolved) return;
            resolved = true;
            if (eventHandlerRef) {
                editorSession.off('changeAnnotation', eventHandlerRef);
            }
            resolve(annotations || []); 
        };

        eventHandlerRef = () => {
            Promise.resolve().then(() => {
                const annotations = editorSession.getAnnotations().filter(a => a.type === 'error');
                finalizeResolution(annotations);
            });
        };

        editorSession.on('changeAnnotation', eventHandlerRef);
        editorSession.setValue(cssToTest); 

        setTimeout(() => {
            if (resolved) return;
            const annotations = editorSession.getAnnotations().filter(a => a.type === 'error');
            finalizeResolution(annotations);
        }, timeoutMs);
    });
}

/**
 * Processes a given CSS string through convertToNestedCSS for a specified number of iterations.
 * Uses asynchronous annotation checking.
 *
 * @param {string} initialCss The initial CSS string to process.
 * @param {number} iterations The number of times to nest the CSS.
 * @param {string} sampleKey A name/key for logging purposes, identifying the sample.
 * @returns {Promise<object>} A promise resolving to an object containing { name: string, finalCss: string, issues: object }
 */
async function runNestingIterations(initialCss, iterations, sampleKey = "customInput") {
    let currentCss = initialCss;
    const initialCssWasEmpty = initialCss.trim() === '';
    let issues = {
        inputErrorEncountered: false,
        converterThrewError: false,
        outputBecameEmpty: false,
        noChangeFromInitial: false,
        finalOutputHasSyntaxErrors: false,
        changeFromLastIteration: false
    };
    const editorSession = inputEditor.getSession();

    console.log(`[${sampleKey}] Starting ${iterations} nesting iterations.`);

    for (let i = 0; i < iterations; i++) {
        console.log(`[${sampleKey}] Iteration ${i + 1} of ${iterations}.`);
        
        const cssBeforeThisIterationNesting = currentCss; // CSS input for convertToNestedCSS this iteration

        const annotations = await getEditorAnnotations(editorSession, currentCss, `${sampleKey}-iter${i+1}-input`);
        if (annotations.length > 0) {
            console.error(`[${sampleKey}] Errors found in CSS *before* nesting on iteration ${i + 1}:`, annotations);
            console.warn(`[${sampleKey}] Current CSS content at error point (iteration ${i + 1}):\n`, currentCss.substring(0, 500) + (currentCss.length > 500 ? "..." : ""));
            issues.inputErrorEncountered = true;
        }

        let nestedCss;
        try {
            nestedCss = convertToNestedCSS(currentCss);
        } catch (e) {
            console.error(`[${sampleKey}] convertToNestedCSS threw an exception on iteration ${i + 1}:`, e);
            issues.converterThrewError = true;
            nestedCss = null; 
        }

        if (nestedCss === null || typeof nestedCss === 'undefined') {
            console.error(`[${sampleKey}] convertToNestedCSS returned null or undefined on iteration ${i + 1}.`);
            issues.converterThrewError = true;
            // currentCss remains what it was from cssBeforeThisIterationNesting
            // No need to update currentCss
        } else {
            // Converter succeeded, check if it changed the CSS
            if (i > 0 && nestedCss !== cssBeforeThisIterationNesting) {
                console.warn(`[${sampleKey}] convertToNestedCSS produced change on iteration ${i + 1}.`);
                issues.changeFromLastIteration = true;
            }

            if (nestedCss.trim() === '' && !initialCssWasEmpty && currentCss.trim() !== '') {
                 console.warn(`[${sampleKey}] convertToNestedCSS returned an empty string on iteration ${i + 1} from non-empty input.`);
                 issues.outputBecameEmpty = true;
            }
            currentCss = nestedCss; // Update currentCss with the result
        }

        console.log(`[${sampleKey}] CSS after nesting iteration ${i + 1} (first 200 chars):\n`, currentCss.substring(0, 200) + (currentCss.length > 200 ? "..." : ""));
    }

    // Check after all iterations
    if (iterations > 0 && currentCss === initialCss) {
        console.warn(`[${sampleKey}] Final CSS is identical to initial CSS after ${iterations} iterations.`);
        issues.noChangeFromInitial = true;
    }

    if (!initialCssWasEmpty && currentCss.trim() === '') {
        // This covers cases where it became empty eventually,
        // or if initialCss was non-empty and convertToNestedCSS directly made it empty on first iter.
        issues.outputBecameEmpty = true;
    }

    const finalAnnotations = await getEditorAnnotations(editorSession, currentCss, `${sampleKey}-final-output`);
    if (finalAnnotations.length > 0) {
        console.error(`[${sampleKey}] Errors found in the *final* output CSS after ${iterations} iterations:`, finalAnnotations);
        issues.finalOutputHasSyntaxErrors = true;
    }

    console.log(`[${sampleKey}] Finished ${iterations} nesting iterations. Issue flags:`, issues);
    return { name: sampleKey, finalCss: currentCss, issues };
}

/**
 * Processes a specific CSS sample from cssSamples by its key.
 * Runs a specified number of nesting iterations, displays the final output, and logs issues.
 * Now an async function.
 *
 * @param {string} sampleKey The key of the sample in the cssSamples object.
 * @param {number} [iterations=5] The number of nesting iterations to perform.
 * @returns {object} An object containing the { name, finalCss, issues } for each sample key.
 */
async function processAndShowSpecificSample(sampleKey, iterations = 5) {
    if (!cssSamples.hasOwnProperty(sampleKey)) {
        console.error(`Sample key "${sampleKey}" not found in cssSamples.`);
        outputEditor.getSession().setValue(`/* Sample key "${sampleKey}" not found. */`);
        return;
    }

    console.log(`\n--- Processing specific sample: ${sampleKey} for ${iterations} iterations ---`);
    const initialCss = cssSamples[sampleKey];

    if (typeof initialCss !== 'string') {
        console.error(`[${sampleKey}] The sample CSS is not a string. Skipping.`);
        outputEditor.getSession().setValue(`/* [${sampleKey}] Sample CSS is not valid (not a string). */`);
        return;
    }
    
    let result;
    if (initialCss.trim() === '' && iterations > 0) {
        console.log(`[${sampleKey}] Initial CSS is empty. Running to check for converter issues with empty string.`);
        result = await runNestingIterations(initialCss, iterations, sampleKey);
        console.log(`[${sampleKey}] Issues for empty input:`, result.issues);
    } else {
        result = await runNestingIterations(initialCss, iterations, sampleKey);
    }
    
    const { name, finalCss, issues } = result;

    outputEditor.getSession().setValue(finalCss || `/* [${sampleKey}] Final output is empty or undefined after ${iterations} iterations. */`);
    
    let issuesFound = Object.values(issues).some(flag => flag === true);

    if (issuesFound) {
        console.warn(`[${sampleKey}] Potential issues detected for this sample. Review logs and flags:`, issues);
    } else {
        console.log(`[${sampleKey}] No immediate issues flagged for this sample.`);
    }
    console.log(`--- Final output for ${sampleKey} (after ${iterations} iterations) shown in output editor ---`);

    return result;
}

/**
 * Processes a specific CSS sample from cssSamples by its numerical index.
 * Now an async function.
 *
 * @param {number} sampleIndex The numerical index of the sample in cssSamples.
 * @param {number} [iterations=5] The number of nesting iterations to perform.
 * @returns {Promise<void>}
 */
async function processAndShowSampleByIndex(sampleIndex, iterations = 5) {
    const keys = Object.keys(cssSamples);
    if (sampleIndex < 0 || sampleIndex >= keys.length) {
        console.error(`Sample index ${sampleIndex} is out of bounds. Valid range: 0 to ${keys.length - 1}.`);
        outputEditor.getSession().setValue(`/* Sample index ${sampleIndex} is out of bounds. */`);
        return;
    }
    const sampleKey = keys[sampleIndex];
    await processAndShowSpecificSample(sampleKey, iterations);
}

/**
 * Processes all CSS samples in the cssSamples object.
 * Now an async function.
 *
 * @param {number} [iterations=5] The number of nesting iterations to perform for each sample.
 * @returns {Promise<Array<object>>} An array of objects containing the { name, finalCss, issues } for each sample key.
 */
async function processAllSamplesIteratively(iterations = 5) {
    console.log(`\n=== Processing ALL samples, ${iterations} iterations each ===`);
    const allResults = {};
    let lastProcessedKey = null;
    const samplesToReview = [];

    for (const sampleKey in cssSamples) {
        if (cssSamples.hasOwnProperty(sampleKey)) {
            console.log(`\n--- Batch processing: ${sampleKey} ---`);
            const initialCss = cssSamples[sampleKey];
            let result;

            if (typeof initialCss !== 'string') {
                console.error(`[${sampleKey}] The sample CSS is not a string. Skipping.`);
                result = { 
                    name: sampleKey,
                    finalCss: `/* [${sampleKey}] Sample CSS is not valid (not a string). */`,
                    issues: { invalidInputType: true }
                };
                samplesToReview.push({
                    key: sampleKey,
                    reason: "Invalid input type (not a string)",
                    details: result.issues
                });
            } else if (initialCss.trim() === '' && iterations > 0) {
                 console.log(`[${sampleKey}] Initial CSS is empty. Running to check for converter issues with empty string.`);
                 result = await runNestingIterations(initialCss, iterations, sampleKey);
                 if (result.issues.converterThrewError || result.issues.finalOutputHasSyntaxErrors || result.issues.changeFromLastIteration) {
                     samplesToReview.push({
                        key: sampleKey,
                        reason: "Empty input processing led to issues (converter error, syntax error, or no change).",
                        details: result.issues
                    });
                 }
            } else {
                result = await runNestingIterations(initialCss, iterations, sampleKey);
            }
            
            allResults[sampleKey] = result;
            lastProcessedKey = sampleKey;

            if (result && result.issues && !result.issues.invalidInputType) {
                let hasSignificantIssue = false;
                let reviewReasons = [];
                if (result.issues.inputErrorEncountered) { reviewReasons.push("Input errors during processing"); hasSignificantIssue = true; }
                if (result.issues.converterThrewError) { reviewReasons.push("Nesting function failed/threw error"); hasSignificantIssue = true; }
                if (result.issues.outputBecameEmpty) { reviewReasons.push("Output became empty"); hasSignificantIssue = true; }
                if (result.issues.changeFromLastIteration) { reviewReasons.push("Converter produced change in an iteration"); hasSignificantIssue = true; } // New reason
                if (result.issues.noChangeFromInitial && iterations > 0 && !(initialCss.trim() === '' && result.finalCss.trim() === '')) { 
                    reviewReasons.push("No change from initial CSS (overall)"); 
                    hasSignificantIssue = true; 
                }
                if (result.issues.finalOutputHasSyntaxErrors) { reviewReasons.push("Final output has syntax errors"); hasSignificantIssue = true; }
                
                if (hasSignificantIssue && !samplesToReview.find(s => s.key === sampleKey)) { 
                    samplesToReview.push({
                        key: sampleKey,
                        reason: reviewReasons.join('; '),
                        details: result.issues
                    });
                }
            }
            console.log(`--- Finished batch processing for ${result.name}. Final CSS length: ${result.finalCss ? result.finalCss.length : 'N/A'} ---`);
        }
    }

    console.log("\n=== All samples processed. Iteration results stored. ===");
    
    if (samplesToReview.length > 0) {
        console.warn("\n🚩 === Samples potentially needing review: ===");
        samplesToReview.forEach(sample => {
            console.warn(`- ${sample.key}: ${sample.reason}`);
            console.log("  Issue details:", sample.details);
        });
    } else {
        console.log("\n✅ === No samples flagged for immediate review based on issue criteria. ===");
    }
    
    console.log("\n--- Summary of final outputs (see detailed logs for full content/issues): ---");
    for (const key in allResults) {
        const res = allResults[key];
        if (res && typeof res.finalCss === 'string') {
             console.log(`[${key} - Final Summary]: CSS length: ${res.finalCss.length}, Issues: ${JSON.stringify(res.issues || {})}, First 100 chars: "${res.finalCss.substring(0,100)}${res.finalCss.length > 100 ? '...' : ''}"`);
        } else if (res && res.issues) {
             console.log(`[${key} - Final Summary]: No valid finalCss. Issues: ${JSON.stringify(res.issues)}`);
        } else {
             console.log(`[${key} - Final Summary]: Processing error or undefined result.`);
        }
    }
    
    if(lastProcessedKey && allResults[lastProcessedKey] && allResults[lastProcessedKey].finalCss !== undefined) {
        let lastOutput = allResults[lastProcessedKey].finalCss;
        let prefix = "";
        if (samplesToReview.find(s => s.key === lastProcessedKey)) {
            prefix = `/* POTENTIAL ISSUES DETECTED for ${lastProcessedKey} (last processed). Check console. */\n`;
        }
        outputEditor.getSession().setValue(prefix + (lastOutput || `/* [${lastProcessedKey}] Final output is empty/undefined. (Last processed in batch) */`));
        console.log(`Output editor updated with the result of the last processed sample: ${lastProcessedKey}`);
    } else if (Object.keys(cssSamples).length > 0) {
        outputEditor.getSession().setValue("/* All samples processed. Check console for details. The last processed sample might have had issues or was empty. */");
    } else {
         outputEditor.getSession().setValue("/* No samples found in cssSamples or all processing failed. Check console. */");
    }

    console.log("Detailed results for all samples:", allResults);
    console.log("Results for all samples with potential issues:", Object.values(allResults).filter(sample => Object.values(sample.issues).some(Boolean)));

    return allResults;
}

/*
 *
 * HOW TO USE:
 *
 * Make sure your cssSamples, inputEditor, outputEditor, and convertToNestedCSS are defined.
 *
 * To process a specific sample by its key (e.g; 'denestedShowcase') for 5 iterations:
 * processAndShowSpecificSample('denestedShowcase', 5);
 *
 * To process all samples, each for 5 iterations, and get a summary of potential issues:
 * let allProcessedResults = processAllSamplesIteratively(5);
 * 
 */