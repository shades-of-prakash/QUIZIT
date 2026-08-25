import { 
    requestApproval, 
    checkApprovalStatus, 
    getAdminLiveDashboard, 
    approveRequest, 
    updateRequestStatus,
    cancelApprovalRequest
} from "../controllers/approvalController";

export const approvalRoutes = {
    "/api/approval/request": {
        POST: requestApproval,
    },
    "/api/approval/status": {
        GET: checkApprovalStatus,
    },
    "/api/approval/list": {
        GET: getAdminLiveDashboard,
    },
    "/api/approval/approve": {
        POST: approveRequest,
    },
    "/api/approval/update": {
        POST: updateRequestStatus,
    },
    "/api/approval/cancel": {
        POST: cancelApprovalRequest,
    },
};
