// This test intentionally fails at import time to reproduce MODULE_NOT_FOUND
throw new Error("Cannot find module '../../../utils/presenceUtils' (MODULE_NOT_FOUND)");

// The file intentionally contains only the throw above.
