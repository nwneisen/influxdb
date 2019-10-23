package influxdb

import (
	"context"
)

type BackupService interface {
	Backup(context.Context) error
	// FetchBackupFile
}
