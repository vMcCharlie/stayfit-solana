import { useState, useCallback } from "react";
import { AlertButton } from "../../app/components/CustomAlert";

export interface AlertState {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
}

export function useCustomAlert() {
    const [alertState, setAlertState] = useState<AlertState>({
        visible: false,
        title: "",
        message: "",
        buttons: [],
    });

    const showAlert = useCallback(
        (title: string, message?: string, buttons: AlertButton[] = [{ text: "OK" }]) => {
            setAlertState({
                visible: true,
                title,
                message,
                buttons,
            });
        },
        []
    );

    const hideAlert = useCallback(() => {
        setAlertState((prev) => ({ ...prev, visible: false }));
    }, []);

    return {
        alertProps: {
            ...alertState,
            onClose: hideAlert,
        },
        showAlert,
        hideAlert,
    };
}
