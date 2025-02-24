// extension.js
const vscode = require('vscode');

// Your custom Tailwind class order (modify this array as per your preferences)
const CLASS_ORDER = [
    'hidden', 'block',
    'group',
    'self', 'container',
    'static', 'relative', 'absolute', 'fixed', 'sticky', 'inset', 'top', 'bottom', 'left', 'right',
    'animate', 'translate', 'duration', 'opacity', 'scale', 'rotate', 'skew',
    'm', 'mx', 'my', 'ml', 'mr', 'mt', 'mb',
    'rounded', 'outline', 'ring', 'border',
    'flex', 'grid', 'inline', 'visible',
    'justify', 'items',
    'gap', 'space',
    'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'size',
    'bg', 'from', 'to', 'clip',
    'p', 'px', 'py', 'pl', 'pr', 'pt', 'pb',
    'text-center', 'text-left', 'text-right',
    'text', 'font', 'leading', 'tracking',
    'hover:', 'focus:',
    'data-',
    'sm:', 'md:', 'lg:', 'xl:', '2xl:',
    'max-sm:', 'max-md:', 'max-lg:', 'max-xl:', 'max-2xl:'
];

function sortTailwindClasses(classString) {
    if (!classString) return classString;

    // Split classes and remove empty entries
    const classes = classString.split(/\s+/).filter(Boolean);
    
    // Separate classes into groups
    const orderedClasses = [];    // Non-prefixed classes
    const unknownClasses = [];    // Unknown classes (not in CLASS_ORDER)
    const hoverFocusGroups = {};  // hover: and focus: prefixed classes
    const dataGroups = {};        // data-[] prefixed classes
    const breakpointGroups = {};  // Breakpoint prefixed classes (sm:, md:, etc.)
    
    // Define boundaries in CLASS_ORDER
    const hoverFocusStart = CLASS_ORDER.indexOf('hover:');
    const dataStart = CLASS_ORDER.indexOf('data-');
    const breakpointStart = CLASS_ORDER.indexOf('sm:');
    const nonPrefixedOrder = CLASS_ORDER.slice(0, hoverFocusStart);
    const hoverFocusPrefixes = CLASS_ORDER.slice(hoverFocusStart, dataStart);
    const dataPrefixes = CLASS_ORDER.slice(dataStart, breakpointStart);
    const breakpointPrefixes = CLASS_ORDER.slice(breakpointStart);
    
    // Categorize classes
    classes.forEach(cls => {
        const isBreakpoint = breakpointPrefixes.some(p => cls.startsWith(p));
        if (isBreakpoint) {
            const prefix = breakpointPrefixes.find(p => cls.startsWith(p));
            if (!breakpointGroups[prefix]) breakpointGroups[prefix] = [];
            breakpointGroups[prefix].push(cls);
        } else {
            const isData = dataPrefixes.some(p => cls.startsWith(p));
            if (isData) {
                const prefix = cls.split(':')[0] + ':'; // Extract full prefix like "data-[state=active]:"
                if (!dataGroups[prefix]) dataGroups[prefix] = [];
                dataGroups[prefix].push(cls);
            } else {
                const isHoverFocus = hoverFocusPrefixes.some(p => cls.startsWith(p));
                if (isHoverFocus) {
                    const prefix = hoverFocusPrefixes.find(p => cls.startsWith(p));
                    if (!hoverFocusGroups[prefix]) hoverFocusGroups[prefix] = [];
                    hoverFocusGroups[prefix].push(cls);
                } else {
                    const isNegative = cls.startsWith('-');
                    const baseCls = isNegative ? cls.slice(1) : cls;
                    const prefix = nonPrefixedOrder.find(p => baseCls.startsWith(p + '-') || baseCls === p) || '';
                    if (prefix) {
                        orderedClasses.push(cls);
                    } else {
                        unknownClasses.push(cls);
                    }
                }
            }
        }
    });
    
    // Sort ordered classes based on non-prefixed CLASS_ORDER
    orderedClasses.sort((a, b) => {
        const aIsNegative = a.startsWith('-');
        const bIsNegative = b.startsWith('-');
        const aBase = aIsNegative ? a.slice(1) : a;
        const bBase = bIsNegative ? b.slice(1) : b;
        const aPrefix = nonPrefixedOrder.find(prefix => aBase.startsWith(prefix + '-') || aBase === prefix) || aBase;
        const bPrefix = nonPrefixedOrder.find(prefix => bBase.startsWith(prefix + '-') || bBase === prefix) || bBase;
        const prefixOrder = nonPrefixedOrder.indexOf(aPrefix) - nonPrefixedOrder.indexOf(bPrefix);
        
        if (prefixOrder !== 0) return prefixOrder;
        if (aIsNegative && !bIsNegative) return 1;
        if (!aIsNegative && bIsNegative) return -1;
        return a.localeCompare(b);
    });
    
    // Sort unknown classes alphabetically
    unknownClasses.sort((a, b) => a.localeCompare(b));
    
    // Sort hover/focus groups
    const sortedHoverFocusClasses = [];
    hoverFocusPrefixes.forEach(prefix => {
        if (hoverFocusGroups[prefix]) {
            hoverFocusGroups[prefix].sort((a, b) => {
                const aBase = a.replace(prefix, '');
                const bBase = b.replace(prefix, '');
                const aIsNegative = aBase.startsWith('-');
                const bIsNegative = bBase.startsWith('-');
                const aBaseNoNeg = aIsNegative ? aBase.slice(1) : aBase;
                const bBaseNoNeg = bIsNegative ? bBase.slice(1) : bBase;
                const aPrefix = nonPrefixedOrder.find(p => aBaseNoNeg.startsWith(p + '-') || aBaseNoNeg === p) || aBaseNoNeg;
                const bPrefix = nonPrefixedOrder.find(p => bBaseNoNeg.startsWith(p + '-') || bBaseNoNeg === p) || bBaseNoNeg;
                const aIndex = nonPrefixedOrder.indexOf(aPrefix);
                const bIndex = nonPrefixedOrder.indexOf(bPrefix);
                
                if (aIndex === -1 && bIndex === -1) return aBase.localeCompare(bBase);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                if (aIndex !== bIndex) return aIndex - bIndex;
                if (aIsNegative && !bIsNegative) return 1;
                if (!aIsNegative && bIsNegative) return -1;
                return aBase.localeCompare(bBase);
            });
            sortedHoverFocusClasses.push(...hoverFocusGroups[prefix]);
        }
    });
    
    // Sort data-[] groups
    const sortedDataClasses = [];
    Object.keys(dataGroups).sort().forEach(prefix => {
        if (dataGroups[prefix]) {
            dataGroups[prefix].sort((a, b) => {
                const aBase = a.replace(prefix, '');
                const bBase = b.replace(prefix, '');
                const aIsNegative = aBase.startsWith('-');
                const bIsNegative = bBase.startsWith('-');
                const aBaseNoNeg = aIsNegative ? aBase.slice(1) : aBase;
                const bBaseNoNeg = bIsNegative ? bBase.slice(1) : bBase;
                const aPrefix = nonPrefixedOrder.find(p => aBaseNoNeg.startsWith(p + '-') || aBaseNoNeg === p) || aBaseNoNeg;
                const bPrefix = nonPrefixedOrder.find(p => bBaseNoNeg.startsWith(p + '-') || bBaseNoNeg === p) || bBaseNoNeg;
                const aIndex = nonPrefixedOrder.indexOf(aPrefix);
                const bIndex = nonPrefixedOrder.indexOf(bPrefix);
                
                if (aIndex === -1 && bIndex === -1) return aBase.localeCompare(bBase);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                if (aIndex !== bIndex) return aIndex - bIndex;
                if (aIsNegative && !bIsNegative) return 1;
                if (!aIsNegative && bIsNegative) return -1;
                return aBase.localeCompare(bBase);
            });
            sortedDataClasses.push(...dataGroups[prefix]);
        }
    });
    
    // Sort breakpoint groups
    const sortedBreakpointClasses = [];
    breakpointPrefixes.forEach(prefix => {
        if (breakpointGroups[prefix]) {
            breakpointGroups[prefix].sort((a, b) => {
                const aBase = a.replace(prefix, '');
                const bBase = b.replace(prefix, '');
                const aIsNegative = aBase.startsWith('-');
                const bIsNegative = bBase.startsWith('-');
                const aBaseNoNeg = aIsNegative ? aBase.slice(1) : aBase;
                const bBaseNoNeg = bIsNegative ? bBase.slice(1) : bBase;
                const aPrefix = nonPrefixedOrder.find(p => aBaseNoNeg.startsWith(p + '-') || aBaseNoNeg === p) || aBaseNoNeg;
                const bPrefix = nonPrefixedOrder.find(p => bBaseNoNeg.startsWith(p + '-') || bBaseNoNeg === p) || bBaseNoNeg;
                const aIndex = nonPrefixedOrder.indexOf(aPrefix);
                const bIndex = nonPrefixedOrder.indexOf(bPrefix);
                
                if (aIndex === -1 && bIndex === -1) return aBase.localeCompare(bBase);
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                if (aIndex !== bIndex) return aIndex - bIndex;
                if (aIsNegative && !bIsNegative) return 1;
                if (!aIsNegative && bIsNegative) return -1;
                return aBase.localeCompare(bBase);
            });
            sortedBreakpointClasses.push(...breakpointGroups[prefix]);
        }
    });
    
    // Combine: ordered -> unknown -> hover/focus -> data -> breakpoints
    return [...orderedClasses, ...unknownClasses, ...sortedHoverFocusClasses, ...sortedDataClasses, ...sortedBreakpointClasses].join(' ');
}

function activate(context) {
    // Register the command
    let disposable = vscode.commands.registerCommand('tailwind-sorter.sortClasses', () => {
        const editor = vscode.window.activeTextEditor;
        
        if (editor) {
            const document = editor.document;
            const selection = editor.selection;

            // If there's a selection, sort only that text
            if (!selection.isEmpty) {
                const text = document.getText(selection);
                const sorted = sortTailwindClasses(text);
                editor.edit(editBuilder => {
                    editBuilder.replace(selection, sorted);
                });
            } else {
                // Otherwise sort all class attributes in the document
                const text = document.getText();
                const newText = text.replace(
                    /class(Name)?=["']([^"']+)["']/g,
                    (match, className, classes) => {
                        return `class${className ? 'Name' : ''}="${sortTailwindClasses(classes)}"`;
                    }
                );
                
                editor.edit(editBuilder => {
                    editBuilder.replace(
                        new vscode.Range(0, 0, document.lineCount, 0),
                        newText
                    );
                });
            }
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};