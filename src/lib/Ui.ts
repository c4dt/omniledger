import { MatSnackBar } from "@angular/material";

export async function showSnack(snack: MatSnackBar, text: string, cmd: () => {} ) {
    const sb = snack.open(text);
    try {
        await cmd();
    } finally {
        sb.dismiss();
    }
}
