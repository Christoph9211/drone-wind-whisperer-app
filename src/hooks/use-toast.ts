
// Import the actual toast implementation
import { useToast as useHookToast } from "@radix-ui/react-toast";

// Re-export the toast hook and actions
export { toast } from "@/components/ui/use-toast";
export const useToast = useHookToast;
