declare interface ActionBody {
    action_id?: number,
    action_date: string,
    action_name: string,
    action_description: string,
    action_type: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    action_amount: number,
    action_currency: string
}