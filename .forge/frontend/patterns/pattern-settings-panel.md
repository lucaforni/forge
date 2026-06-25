# Pattern: Settings Panel

**Severity**: Advanced · **Stack**: shadcn/ui Tabs + React Hook Form v7 + Zod + React Query + Sonner
**Depends on**: Tabs, Card, Form, Input, Select, Switch, Button, Separator, Avatar, ScrollArea, Alert

---

## 1. When to Use

**Use this pattern when**:
- The user needs to configure personal / account / app preferences
- Multiple independent settings sections (e.g. Profile, Notifications, Security, Appearance)
- Each section has its own independent save (not a single form)
- Examples: profile settings, notification preferences, app configuration, password change

**Do NOT use this pattern when**:
- Single simple form (use Form pattern)
- Admin page with full CRUD (use Data Table + Form)
- Single toggle without associated form (use Switch with direct mutation)
- Only theme/appearance change (use Theme Toggle pattern)

---

## 2. Components

| Component | Usage | Variant |
|------------|-----|----------|
| Tabs | Navigation between settings sections | default |
| TabsList, TabsTrigger, TabsContent | Tabs structure | default |
| Card | Container for each form section | default |
| CardHeader, CardTitle, CardDescription | Section header | default |
| CardContent | Form body | default |
| Form | React Hook Form wrapper | default |
| FormField, FormItem, FormLabel, FormControl, FormMessage | Form field | default |
| Input | Text, email, URL | default |
| Select | Selection from closed list | default |
| Switch | Toggle on/off (+ optimistic UI) | default |
| Button | Save per section | variant: default/outline/destructive |
| Separator | Division between sections | default |
| Avatar | Profile picture / user icon | default |
| ScrollArea | Scrollable tabs on mobile | default |
| Alert | Generic section error | variant: destructive |

---

## 3. JSX Structure

```tsx
<Tabs value={activeSection} onValueChange={setActiveSection}>
<div className="flex flex-col lg:flex-row gap-6">
  {/* ── TABS NAVIGATION ── */}
  <aside className="lg:w-64 shrink-0">
    <TabsList className="flex lg:flex-col w-full h-auto overflow-x-auto lg:overflow-x-visible gap-1 bg-transparent">
      {sections.map((section) => (
        <TabsTrigger
          key={section.id}
          value={section.id}
          className="flex items-center gap-3 justify-start w-full px-3 py-2.5 data-[state=active]:bg-accent"
        >
          <section.icon className="h-4 w-4 shrink-0" />
          <span className="text-sm truncate">{section.title}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  </aside>

  {/* ── ACTIVE SECTION ── */}
  <main className="flex-1 min-w-0">
    <TabsContent value={activeSection} className="mt-0 space-y-6">
      {sections.map((section) => (
        <div key={section.id} hidden={section.id !== activeSection}>
          <section.component />
        </div>
      ))}
    </TabsContent>
  </main>
</div>
</Tabs>
```

### Per-Section Form

```tsx
<Card>
  <CardHeader>
    <CardTitle>Profile</CardTitle>
    <CardDescription>Your public name and email</CardDescription>
  </CardHeader>
  <CardContent>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-end gap-3 pt-2">
          {form.formState.isDirty && (
            <p className="text-xs text-muted-foreground mr-auto">Unsaved changes</p>
          )}
          <Button
            type="submit"
            disabled={isSaving || !form.formState.isDirty}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  </CardContent>
</Card>
```

### Toggle Switch (optimistic)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
    <CardDescription>Manage your notification preferences</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {notifications.map((item) => (
      <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>{item.label}</Label>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        <Switch
          checked={item.enabled}
          onCheckedChange={(checked) => toggleNotification(item.id, checked)}
        />
      </div>
    ))}
  </CardContent>
</Card>
```

---

## 4. State Machine

```yaml
Pattern: SettingsPanel
Initial: idle

States (per-section):
  idle:
    description: "Section loaded, no changes"
    ui: "Fields populated with current data. Save button disabled (no changes)."
    transitions:
      on_field_change → editing

  editing:
    description: "User has modified one or more fields"
    ui: "Editable fields. Save button enabled. 'Unsaved changes' indicator visible."
    transitions:
      on_save_click → saving
      on_revert → idle (reset to defaultValues)

  saving:
    description: "Saving in progress"
    ui: "Save button disabled + spinner 'Saving...'. Fields disabled."
    transitions:
      on_success → saved
      on_error → error

  saved:
    description: "Section saved successfully"
    ui: "Toast 'Settings saved'. Save button disabled (data = server). Fields re-editable."
    transitions:
      on_field_change → editing
      on_auto → idle (after 2s without changes)

  error:
    description: "Section save error"
    ui: "Destructive alert at top of section with error message. Fields re-editable with changes preserved. Save button re-enabled."
    transitions:
      on_field_change → editing
      on_save_click → saving (retry)

States (per-page):
  has-unsaved-changes:
    description: "At least one section in editing state"
    ui: "Navigation guard on tab change or navigation: 'You have unsaved changes. Want to leave?'"
    transitions:
      on_all_sections_saved → all-saved
      on_confirm_leave → (abandon changes)
      on_cancel_leave → (stay on page)

  all-saved:
    description: "All sections in idle or saved state"
    ui: "No warning. Free navigation."
    transitions:
      on_any_section_edit → has-unsaved-changes
```

---

## 5. Data Flow

### 5.1 React Query — Separated per section

```tsx
// Each section has independent query and mutation
function useProfileSettings() {
  return useQuery({
    queryKey: ['settings', 'profile'],
    queryFn: () => api.getProfileSettings(),
    staleTime: 5 * 60_000,
  })
}

function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfileFormValues) => api.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated')
      queryClient.invalidateQueries({ queryKey: ['settings', 'profile'] })
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Error saving')
    },
  })
}
```

### 5.2 Optimistic UI for Switch (immediate toggle)

```tsx
const toggleNotification = useMutation({
  mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
    api.updateNotification(id, { enabled }),
  onMutate: async ({ id, enabled }) => {
    await queryClient.cancelQueries({ queryKey: ['settings', 'notifications'] })
    const previous = queryClient.getQueryData(['settings', 'notifications'])
    queryClient.setQueryData(['settings', 'notifications'], (old: Notification[]) =>
      old.map((n) => (n.id === id ? { ...n, enabled } : n))
    )
    return { previous }
  },
  onError: (_err, { id }, context) => {
    queryClient.setQueryData(['settings', 'notifications'], context?.previous)
    toast.error('Update error')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] })
  },
})
```

### 5.3 Navigation Guard

```tsx
// Tab change with unsaved changes
function handleTabChange(newTab: string) {
  if (hasUnsavedChanges) {
    if (!confirm('You have unsaved changes. Leave without saving?')) {
      return
    }
  }
  setActiveSection(newTab)
}

// Router exit (Next.js App Router)
useEffect(() => {
  if (hasUnsavedChanges) {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }
}, [hasUnsavedChanges])
```

### 5.4 Password Change Pattern

```tsx
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
```

---

## 6. TypeScript Types

```tsx
// Section configuration
interface SettingsSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType
  queryKey: string[]
}

// Settings page props
interface SettingsPageProps {
  sections: SettingsSection[]
  defaultSection?: string
  onSectionChange?: (sectionId: string) => void
}

// Per-section state for navigation guard
type SectionStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error'

interface SettingsPageState {
  currentSection: string
  sectionStatuses: Record<string, SectionStatus>
  hasUnsavedChanges: boolean
}
```

---

## 7. Accessibility

### Tabs Navigation
- Tabs container: `role="tablist"` with `aria-label="Settings sections"`
- Trigger tabs: `role="tab"` with `aria-selected`, `aria-controls={panelId}`, `id={tabId}`
- Content panel: `role="tabpanel"` with `aria-labelledby={tabId}`
- `aria-orientation="vertical"` on desktop, `aria-orientation="horizontal"` on mobile

### Keyboard
| Key | Action |
|-------|--------|
| Arrow Down (desktop) | Next section |
| Arrow Up (desktop) | Previous section |
| Arrow Right (mobile) | Next section |
| Arrow Left (mobile) | Previous section |
| Home | First section |
| End | Last section |
| Tab | Move focus between navigation and active content |
| Ctrl+Enter / Cmd+Enter | Save active section |

### Focus Management
- Section change: focus moves to first field of the new section's form
- Saving: focus stays on Save button (or moves to success message)
- Per-field error: focus on first field in error
- Generic error: focus on Alert
- Switch toggle: focus stays on Switch after toggle

### Screen Reader Flow
```
1. "Settings. Navigation with {N} sections: Profile, Notifications, Security."
2. "Active section: Profile. Table with 2 fields."
3. "Name field. Editing in progress."
4. "Save successful for Profile section."
5. "Save error for Notifications section. Alert: {message}."
```

---

## 8. Responsive

| Breakpoint | Navigation | Content |
|------------|-------------|-----------|
| ≥ 1024px | Fixed left sidebar `lg:w-64`, vertical orientation | Section full-width, max-w-2xl |
| 768-1023px | Left sidebar `lg:w-48`, vertical orientation | Section full-width |
| < 768px | Horizontal scrollable tabs at top of page | Section full-width, 4px side padding |

```tsx
<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
  <aside className="lg:w-64 shrink-0">
    {/* Desktop: vertical tabs */}
    {/* Mobile: horizontal scrollable tabs */}
  </aside>
  <main className="flex-1 min-w-0 max-w-2xl px-4 lg:px-0">
    {/* section forms */}
  </main>
</div>
```

- Desktop: sidebar sticky with `sticky top-24`
- Mobile: tabs bar `overflow-x-auto` with `scrollable-tabs` and `gap-2`
- Card: full-width on mobile, max-w-2xl on desktop
- Form fields: single column on mobile, grid-cols-2 optional on desktop

---

## 9. QA Checklist

### Pattern-Specific
- [ ] Per-section save (not single block): each section has its own submit
- [ ] Per-section loading state: saving section does not block others
- [ ] Per-section error state: error in one section does not block others
- [ ] Success toast: `toast.success('Settings saved')` after each save
- [ ] Unsaved changes indicator: "Unsaved changes" text when form is dirty
- [ ] Navigation guard: tab change or navigation requires confirmation if dirty
- [ ] beforeunload: browser warning if user closes tab with changes
- [ ] Optimistic UI for Switch: immediate toggle with rollback on error
- [ ] Per-section form validation: each section has its own Zod schema
- [ ] Password confirmation: confirmPassword field + Zod refinement
- [ ] Reset/Revert: ability to discard changes and return to server state
- [ ] Separate queryKey: each section has unique queryKey (e.g. `['settings', 'profile']`)
- [ ] StaleTime: settings do not require frequent refresh (5+ minutes)
- [ ] Disabled form during saving: fields disabled + button spinner
- [ ] Avatar upload: preview before save, async upload

### States Verified
- [ ] Idle: form populated with server data, save button disabled
- [ ] Editing: fields modified, save button enabled, indicator visible
- [ ] Saving: spinner + fields disabled, other sections interactable
- [ ] Saved: success toast, save button disabled, fields re-editable
- [ ] Error: alert in section, changes preserved, retry possible
- [ ] Field error: FormMessage visible, focus on first error
- [ ] Navigation guard with dirty: confirmation shown, exit or cancel
- [ ] Navigation guard without dirty: smooth transition, no warning
- [ ] Optimistic switch: immediate toggle, visual rollback on error
- [ ] Password mismatch: validation error on confirmPassword

### Data Flow
- [ ] React Query enabled: data loading on section mount
- [ ] Query key namespaced: `['settings', '{sectionId}']`
- [ ] Mutation invalidates only its own queryKey
- [ ] Optimistic update rollback: data restored to pre-mutation state
- [ ] Default values sync: form.reset() called after query load
- [ ] Form reset on success: `form.reset(formValues)` to clear isDirty
