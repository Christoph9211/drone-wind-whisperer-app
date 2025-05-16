
// Import the necessary dependencies
import { useToast as useUIToast } from "@/components/ui/toast";

// Re-export the useToast hook with a different name to avoid conflicts
export { useUIToast as useToast };

// Re-export the toast function
export { toast } from "@/components/ui/sonner";
