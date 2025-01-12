// Файл загрузка
import React, { useState, } from "react";
import styles from './fileUploadButton.module.scss';

export interface FileUploadButtonProps<T> {
    onFileUpload: (content: T) => void; // Колбэк для обработки файла
    expectedInterface: T; // Ожидаемый интерфейс
}

const FileUploadButton = <T extends {}>({
    onFileUpload,
    expectedInterface
}: FileUploadButtonProps<T>) => {
    const [isDragging, setIsDragging] = useState(false); // Состояние для отслеживания drag&drop

    // Обработчик события при перетаскивании файла
    const handleDragOverFile = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true); // Отмечаем, что файл перетаскивается
    };
    // Обработчик события при выходе из области перетаскивания
    const handleDragLeaveFile = () => {
        setIsDragging(false); // Убираем отметку перетаскивания
        };

    // Обработчик события при сбросе файла
    // Обработчик события при сбросе файла
    const handleDropFile = (e: React.DragEvent) => {
        // setModified(true);
        e.preventDefault();
        setIsDragging(false); // Убираем отметку перетаскивания

        const file = e.dataTransfer.files[0]; // Получаем файл из события
        if (file && file.type === 'application/json') {
            readFile(file);

        } else {
            alert('Пожалуйста, загрузите файл в формате JSON');
        }
    };

    // Обработчик для загрузки файла при клике
    const handleFileClick = () => {
        // Динамически создаем элемент input для выбора файла
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json'; // Ограничиваем выбор только JSON файлов
        fileInput.onchange = (e) => {
            const inputElement = e.target as HTMLInputElement; // Приводим target к типу HTMLInputElement
            const file = inputElement.files?.[0]; // Теперь TypeScript знает, что у нас есть поле files
            if (file && file.type === 'application/json') {
                readFile(file);
            }
        };
        fileInput.click(); // Триггерим клик на элементе input
        // setModified(true);
    };

    // Функция для проверки содержимого файла на соответствие ожидаемому интерфейсу
    const validateFileContent = (content: any, expected: T): boolean => {
        for (const key in expected) {
            if (expected.hasOwnProperty(key)) {
                if (!content[key] || typeof content[key] !== typeof expected[key]) {
                    return false;
                }
            }
        }
        return true;
    };


    // Функция для обработки файла
    const readFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const content = JSON.parse(reader.result as string);
                // Проверяем, что файл соответствует ожидаемому интерфейсу
                if (validateFileContent(content, expectedInterface)) {
                    onFileUpload(content as T); // Если все ок, передаем содержимое в колбек
                } else {
                    alert("Invalid file format.");
                }
            } catch (err) {
                alert("Unable to read or parse the file.");
            }
        };
        reader.readAsText(file);
    };


    return (<div
        className={`${styles.container_card_load} ${isDragging ? 'dragover' : ''}`}
        onDragOver={handleDragOverFile}
        onDragLeave={handleDragLeaveFile}
        onDrop={handleDropFile}
        onClick={handleFileClick}
    > Загрузите файл JSON сюда </div>)
}
export default FileUploadButton;