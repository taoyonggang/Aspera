package attachment

import (
	"bytes"
	"encoding/binary"

	"gopkg.in/restruct.v1"
)

type TransferAssetAttachment struct {
	Asset       uint64
	QuantityQNT uint64

	NumComment uint16 `struct:"-"`
	Comment    []byte `struct:"-"`
}

func TransferAssetAttachmentFromBytes(bs []byte, version uint8) (Attachment, int, error) {
	var attachment TransferAssetAttachment
	err := restruct.Unpack(bs, binary.LittleEndian, &attachment)

	len := 8 + 8
	if version == 0 {
		r := bytes.NewReader(bs[len:])
		if err := binary.Read(r, binary.LittleEndian, &attachment.NumComment); err != nil {
			return nil, 0, err
		}

		attachment.Comment = make([]byte, attachment.NumComment)
		if err := binary.Read(r, binary.LittleEndian, &attachment.Comment); err != nil {
			return nil, 0, err
		}

		len += 2 + int(attachment.NumComment)
	}

	return &attachment, len, err
}

func (attachment *TransferAssetAttachment) ToBytes(version uint8) ([]byte, error) {
	bs, err := restruct.Pack(binary.LittleEndian, attachment)
	if err != nil {
		return nil, err
	}

	if version == 0 {
		buf := bytes.NewBuffer(nil)

		if err := binary.Write(buf, binary.LittleEndian, attachment.NumComment); err != nil {
			return nil, err
		}

		if err := binary.Write(buf, binary.LittleEndian, attachment.Comment); err != nil {
			return nil, err
		}

		return append(bs, buf.Bytes()...), nil
	}

	return bs, nil
}