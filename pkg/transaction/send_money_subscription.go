package transaction

import (
	"encoding/binary"

	"gopkg.in/restruct.v1"
)

type SendMoneySubscriptionTransaction struct {
	Frequency uint32
}

func SendMoneySubscriptionTransactionFromBytes(bs []byte) (Transaction, error) {
	var tx SendMoneySubscriptionTransaction
	err := restruct.Unpack(bs, binary.LittleEndian, &tx)
	return &tx, err
}
