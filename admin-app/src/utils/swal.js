import Swal from 'sweetalert2';

const MySwal = Swal.mixin({
    customClass: {
        confirmButton: 'bg-brand-red text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-all mx-2 shadow-lg shadow-red-100',
        cancelButton: 'bg-gray-100 text-gray-500 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-all mx-2',
        popup: 'rounded-3xl border-0 shadow-2xl p-8',
        title: 'text-2xl font-black text-gray-900',
        htmlContainer: 'text-gray-500 font-medium'
    },
    buttonsStyling: false,
    confirmButtonText: 'Understood',
    showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
    },
    hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
    }
});

export const showAlert = (title, text, icon = 'success') => {
    return MySwal.fire({
        title,
        text,
        icon,
        timer: icon === 'success' ? 3000 : null,
        showConfirmButton: icon !== 'success',
        timerProgressBar: icon === 'success',
    });
};

export const showSuccess = (title, text) => {
    return showAlert(title, text, 'success');
};

export const showError = (title, text) => {
    return showAlert(title, text, 'error');
};

export const showConfirm = (title, text, confirmText = 'Yes, Proceed') => {
    return MySwal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        reverseButtons: true
    });
};

export const showLoading = (title = 'Processing...') => {
    MySwal.fire({
        title,
        allowOutsideClick: false,
        didOpen: () => {
            MySwal.showLoading();
        }
    });
};

export const closeLoading = () => {
    MySwal.close();
};

export default MySwal;
