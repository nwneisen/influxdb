package http

import (
	"net/http"

	"github.com/influxdata/influxdb"
	"github.com/influxdata/influxdb/kit/tracing"
	"github.com/julienschmidt/httprouter"
	"go.uber.org/zap"
)

// BackupBackend is all services and associated parameters required to construct the BackupHandler.
type BackupBackend struct {
	Logger *zap.Logger
	influxdb.HTTPErrorHandler

	BackupService influxdb.BackupService
}

// NewBackupBackend returns a new instance of BackupBackend.
func NewBackupBackend(b *APIBackend) *BackupBackend {
	return &BackupBackend{
		Logger: b.Logger.With(zap.String("handler", "backup")),

		HTTPErrorHandler:    b.HTTPErrorHandler,
		BackupService:       b.BackupService,
	}
}

type BackupHandler struct {
	influxdb.HTTPErrorHandler
	*httprouter.Router

	Logger *zap.Logger

	BackupService influxdb.BackupService
}

const (
	backupPath = "/api/v2/backup"
)

// NewBackupHandler creates a new handler at /api/v2/delete to receive delete requests.
func NewBackupHandler(b *BackupBackend) *BackupHandler {
	h := &BackupHandler{
		HTTPErrorHandler: b.HTTPErrorHandler,
		Router:           NewRouter(b.HTTPErrorHandler),
		Logger:           b.Logger,
		BackupService:    b.BackupService,
	}

	h.HandlerFunc("POST", backupPath, h.handleBackup)
	return h
}

func (h *BackupHandler) handleBackup(w http.ResponseWriter, r *http.Request) {
	span, r := tracing.ExtractFromHTTPRequest(r, "DeleteHandler")
	defer span.Finish()

	ctx := r.Context()
	defer r.Body.Close()

	// a, err := pcontext.GetAuthorizer(ctx)
	// if err != nil {
	// 	h.HandleHTTPError(ctx, err, w)
	// 	return
	// }

	err := h.BackupService.Backup(ctx)
	if err != nil {
		h.HandleHTTPError(ctx, err, w)
	}
}
