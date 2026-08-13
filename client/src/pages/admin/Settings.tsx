import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const inputClass = "h-[48px] rounded-2xl border border-[#e5e5e5] px-4 text-sm w-full outline-none focus:border-primary/40 bg-white";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{children}</p>;
}

interface ProfileFormValues {
  name: string;
  email: string;
}

function ProfileForm({ admin }: { admin: { name: string | null; email: string } }) {
  const utils = trpc.useUtils();
  const { register, handleSubmit, reset } = useForm<ProfileFormValues>({
    defaultValues: { name: admin.name || "", email: admin.email },
  });

  useEffect(() => {
    reset({ name: admin.name || "", email: admin.email });
  }, [admin.name, admin.email, reset]);

  const updateProfile = trpc.adminAuth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.adminAuth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => updateProfile.mutate(values))}
      className="border border-[#e5e5e5] rounded-2xl p-5 flex flex-col gap-4"
    >
      <h3 className="font-display text-lg">Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Name</SectionLabel>
          <input {...register("name")} className={inputClass} />
        </div>
        <div>
          <SectionLabel>Email</SectionLabel>
          <input {...register("email")} type="email" className={inputClass} />
        </div>
      </div>
      <button
        type="submit"
        disabled={updateProfile.isPending}
        className="h-[44px] px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 self-start"
      >
        {updateProfile.isPending ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
}

function PasswordForm() {
  const { register, handleSubmit, reset } = useForm<PasswordFormValues>();

  const changePassword = trpc.adminAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed");
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={handleSubmit((values) => changePassword.mutate(values))}
      className="border border-[#e5e5e5] rounded-2xl p-5 flex flex-col gap-4"
    >
      <h3 className="font-display text-lg">Change Password</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Current Password</SectionLabel>
          <input {...register("currentPassword")} type="password" className={inputClass} />
        </div>
        <div>
          <SectionLabel>New Password</SectionLabel>
          <input {...register("newPassword")} type="password" className={inputClass} />
        </div>
      </div>
      <button
        type="submit"
        disabled={changePassword.isPending}
        className="h-[44px] px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 self-start"
      >
        {changePassword.isPending ? "Saving..." : "Change Password"}
      </button>
    </form>
  );
}

interface BusinessFormValues {
  pickupAddress: string;
  pickupInstructions: string;
  shopAddressForDistance: string;
  deliveryTiers: { maxKm: number; fee: number }[];
  beyondTierFee: number;
}

function BusinessSettingsForm() {
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();

  const { register, handleSubmit, reset, control } = useForm<BusinessFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "deliveryTiers" });

  useEffect(() => {
    if (!settings) return;
    reset({
      pickupAddress: settings.pickupAddress,
      pickupInstructions: settings.pickupInstructions || "",
      shopAddressForDistance: settings.shopAddressForDistance,
      deliveryTiers: settings.deliveryTiers,
      beyondTierFee: settings.beyondTierFee,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.id, reset]);

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Business settings updated");
      utils.settings.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (values: BusinessFormValues) => {
    updateSettings.mutate({
      pickupAddress: values.pickupAddress,
      pickupInstructions: values.pickupInstructions || undefined,
      shopAddressForDistance: values.shopAddressForDistance,
      deliveryTiers: values.deliveryTiers.map((t) => ({ maxKm: Number(t.maxKm), fee: Number(t.fee) })),
      beyondTierFee: Number(values.beyondTierFee),
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="border border-[#e5e5e5] rounded-2xl p-5 flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-[#e5e5e5] rounded-2xl p-5 flex flex-col gap-6">
      <h3 className="font-display text-lg">Business Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Pickup Address (shown to customers)</SectionLabel>
          <input {...register("pickupAddress")} className={inputClass} />
        </div>
        <div>
          <SectionLabel>Pickup Instructions</SectionLabel>
          <input {...register("pickupInstructions")} placeholder="e.g. Usually ready in 2-4 days" className={inputClass} />
        </div>
        <div className="md:col-span-2">
          <SectionLabel>Shop Address (for delivery distance calculation)</SectionLabel>
          <input {...register("shopAddressForDistance")} className={inputClass} />
        </div>
      </div>

      <div>
        <SectionLabel>Delivery Fee Tiers</SectionLabel>
        <div className="flex flex-col gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0 w-16">Up to</span>
              <input
                {...register(`deliveryTiers.${index}.maxKm` as const, { valueAsNumber: true })}
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="km"
              />
              <span className="text-sm text-muted-foreground shrink-0">km &rarr; $</span>
              <input
                {...register(`deliveryTiers.${index}.fee` as const, { valueAsNumber: true })}
                type="number"
                step="1"
                className={inputClass}
                placeholder="fee"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 h-[48px] w-[48px] flex items-center justify-center rounded-2xl border border-[#e5e5e5] text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ maxKm: 0, fee: 0 })}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#603b17] hover:opacity-80 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Tier
        </button>
      </div>

      <div className="max-w-xs">
        <SectionLabel>Fee Beyond Furthest Tier ($)</SectionLabel>
        <input {...register("beyondTierFee", { valueAsNumber: true })} type="number" step="1" className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={updateSettings.isPending}
        className="h-[44px] px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 self-start"
      >
        {updateSettings.isPending ? "Saving..." : "Save Business Settings"}
      </button>
    </form>
  );
}

export default function Settings() {
  const { admin, loading } = useAdminAuth();

  return (
    <AdminLayout>
      <div className="p-6 md:p-10 max-w-3xl">
        <h1 className="mb-1">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account and business details.</p>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg">Account</h2>
            <Link
              href="/admin/signup"
              className="flex items-center gap-1.5 text-sm font-medium text-[#603b17] hover:opacity-80 transition-opacity"
            >
              <UserPlus className="h-4 w-4" />
              Invite Admin
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {loading || !admin ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <ProfileForm admin={admin} />
                <PasswordForm />
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg mb-4">Business</h2>
          <BusinessSettingsForm />
        </section>
      </div>
    </AdminLayout>
  );
}
