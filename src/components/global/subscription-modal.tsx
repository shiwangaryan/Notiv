import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { useSubscriptionModal } from "@/lib/server-action/subscription-modal-provider";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import Loader from "./loader";

const SubscriptionModal = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { open, setOpen } = useSubscriptionModal();
  const { subscription } = useSupabaseUser();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {subscription?.status === "active" ? (
        <DialogContent>Already on a paid plan!</DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            To access Pro features you need to have a paid plan.
          </DialogDescription>
          {/* <div
            className="flex
          justify-between
          items-center"
          >
            <React.Fragment>
              <b className="text-3xl text-foreground">
                $12.99 / <small>month</small>
              </b>
              <Button disabled={isLoading} className="bg-white/90">
                {isLoading ? <Loader /> : "Upgrade  ✨"}
              </Button>
            </React.Fragment>
          </div> */}
          No Products Available
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;
