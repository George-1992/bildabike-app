'use client';
import { Toaster, toast } from 'sonner';
// import "./style.scss"; // Import the custom styles for Sonnar toasts

export default function ToasterSonnar() {
    return (
        <div>
            <Toaster
                position="top-right"
                richColors
                // closeButton
            />
            {/* <button onClick={() => toast('My first toast')}>Give me a toast</button> */}
        </div>
    );
}



export const notify = ({
    type = "default",
    timer = 5000, // 5 seconds
    message = "This is a test notification from Sonnar!"
}) => {

    const action = {
        label: 'Close',
        onClick: () => console.log('Undo')
    }


    if (type === 'success') {
        toast.success(message, {
            duration: timer,
            position: "top-right",
            theme: "light",
            action: action,
        });
    }
    else if (type === 'warning') {
        toast.warning(message, {
            duration: timer,
            position: "top-right",
            theme: "light",
            action: action,
        });
    }
    else if (type === 'error') {
        toast.error(message, {
            duration: timer,
            position: "top-right",
            theme: "light",
            action: action,
        });
    }
    else if (type === 'info') {
        toast.info(message, {
            duration: timer,
            position: "top-right",
            theme: "light",
            action: action,
        });
    }
    // else if (type === 'promise') {
    //     toast.promise(promise, {
    //         loading: 'Loading...',
    //         success: (data) => {
    //             return `${data.name} toast has been added`;
    //         },
    //         error: 'Error',
    //     });
    // }
    else {
        toast(message)

    }

};
