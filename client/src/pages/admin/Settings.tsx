import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Link } from "wouter";
import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionTitle, LoadingBlock, adminCard, adminInput, adminButtonPrimary } from "@/components/admin/AdminUI";

const inputClass = adminInput;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-neutral-500 mb-1.5">{children}</p>;
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
      className={`${adminCard} p-4 md:p-5 flex flex-col gap-4`}
    >
      <h3>Profile</h3>
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
        className={`${adminButtonPrimary} self-start`}
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
      className={`${adminCard} p-4 md:p-5 flex flex-col gap-4`}
    >
      <h3>Change Password</h3>
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
        className={`${adminButtonPrimary} self-start`}
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
      <div className={adminCard}>
        <LoadingBlock />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${adminCard} p-4 md:p-5 flex flex-col gap-6`}>
      <h3>Business Settings</h3>

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
              <span className="text-sm text-neutral-500 shrink-0">Up to</span>
              <input
                {...register(`deliveryTiers.${index}.maxKm` as const, { valueAsNumber: true })}
                type="number"
                step="0.1"
                className={`${inputClass} min-w-0`}
                placeholder="km"
              />
              <span className="text-sm text-neutral-500 shrink-0">km &rarr; $</span>
              <input
                {...register(`deliveryTiers.${index}.fee` as const, { valueAsNumber: true })}
                type="number"
                step="1"
                className={`${inputClass} min-w-0`}
                placeholder="fee"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Remove tier"
                className="shrink-0 h-10 w-10 flex items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-500 hover:text-destructive hover:border-destructive/40 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => append({ maxKm: 0, fee: 0 })}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
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
        className={`${adminButtonPrimary} self-start`}
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
      <div className="max-w-3xl">
        <PageHeader title="Settings" description="Manage your account and business details." />

        <section className="mb-8">
          <SectionTitle
            aside={
              <Link
                href="/admin/signup"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
              >
                <UserPlus className="h-4 w-4" />
                Invite admin
              </Link>
            }
          >
            Account
          </SectionTitle>
          <div className="flex flex-col gap-4">
            {loading || !admin ? (
              <LoadingBlock />
            ) : (
              <>
                <ProfileForm admin={admin} />
                <PasswordForm />
              </>
            )}
          </div>
        </section>

        <section>
          <SectionTitle>Business</SectionTitle>
          <BusinessSettingsForm />
        </section>
      </div>
    </AdminLayout>
  );
}
