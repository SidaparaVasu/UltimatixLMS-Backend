import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLocations } from '@/queries/admin/useAdminMasters';
import { Location } from '@/api/admin-mock-api';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminActionBar } from '@/components/admin/AdminActionBar';
import { AdminTableSkeleton } from '@/components/admin/AdminTableSkeleton';
import { Dialog } from '@/components/ui/dialog';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  TableStatusBadge,
  TableActionCell,
  TableIconButton,
  TableIdCell
} from '@/components/ui/table';

const LocationPage: React.FC = () => {
  const { data: locations, isLoading, error } = useLocations();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    country: '',
    isActive: true
  });

  const handleOpenDialog = (loc?: Location) => {
    if (loc) {
      setEditingLocation(loc);
      setFormData({ 
        name: loc.name, 
        code: loc.code, 
        city: loc.city,
        country: loc.country,
        isActive: loc.isActive 
      });
    } else {
      setEditingLocation(null);
      setFormData({ name: '', code: '', city: '', country: '', isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    console.log('Saved:', formData);
    setIsDialogOpen(false);
  };

  // Filter Data
  const filteredData = locations?.filter(loc => {
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? loc.isActive : !loc.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="content-inner">
      <AdminPageHeader 
        title="Unit Locations"
        description="Manage physical office locations and remote hubs across the organization."
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Organization' },
          { label: 'Unit Locations' }
        ]}
        action={
          <button 
            className="btn-primary"
            onClick={() => handleOpenDialog()}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-2)',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={16} />
            Add Unit Location
          </button>
        }
      />

      <AdminActionBar 
        searchPlaceholder="Search by Location Name, Code, or City..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultCount={filteredData?.length}
      >
        <select
          className="form-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          style={{ width: '140px', cursor: 'pointer', flexShrink: 0 }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </AdminActionBar>

      {/* ── Data Table ── */}
      {isLoading ? (
        <AdminTableSkeleton rowCount={4} columnCount={5} showActionCol />
      ) : error ? (
        <div className="flex justify-center p-8 text-red-500">Failed to load Locations.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location Code</TableHead>
              <TableHead>Location Name</TableHead>
              <TableHead>City, Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ textAlign: 'center' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>No locations found.</span>
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((loc) => (
                <TableRow key={loc.id}>
                  <TableIdCell>{loc.code}</TableIdCell>
                  <TableCell style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{loc.name}</TableCell>
                  <TableCell>{loc.city}, {loc.country}</TableCell>
                  <TableCell>
                    <TableStatusBadge variant={loc.isActive ? 'active' : 'inactive'}>
                      {loc.isActive ? 'Active' : 'Inactive'}
                    </TableStatusBadge>
                  </TableCell>
                  <TableActionCell>
                    <TableIconButton 
                      variant="edit" 
                      title="Edit Location" 
                      onClick={() => handleOpenDialog(loc)}
                    />
                  </TableActionCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* ── Add/Edit Dialog ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingLocation ? "Edit Unit Location" : "Add Unit Location"}
        description="Provide the geographical details for this company site."
        footer={
          <>
            <button 
              className="btn-secondary"
              onClick={() => setIsDialogOpen(false)}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--color-text-primary)'
              }}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleSave}
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              {editingLocation ? "Update Unit Location" : "Create Unit Location"}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="form-group">
            <label className="form-label">Unit Location Code *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. MUM-BDRA" 
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit Location Name *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Mumbai Office"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">City *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Mumbai"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Country *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. India"
              value={formData.country}
              onChange={e => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <div>
              <label className="form-label" style={{ display: 'block', color: 'var(--color-text-primary)' }}>Active Status</label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default LocationPage;
