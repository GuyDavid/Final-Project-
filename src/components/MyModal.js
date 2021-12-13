import { Modal } from "react-bootstrap";
import React from "react";
export default function MyModal({ show, onHide, title, body, footer }) {
    return (
        <Modal show={show} onHide={onHide} >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            {body}
            {footer}
        </Modal>
    )
}